"""
FormSense AI — Document Rotation Prediction Training
=====================================================
Pipeline:
  1. Load scan_doc_rotation dataset (archive (2))
  2. Load images + rotation angle labels
  3. Train a lightweight CNN to predict rotation angle
  4. Evaluate on test set (MAE, MSE)
  5. Save trained model
"""

import os
import sys
import json
import time
import logging
from pathlib import Path

import numpy as np
from PIL import Image

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("RotationTraining")

# ── Paths ──────────────────────────────────────────────────
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BACKEND_DIR, "..", "..", "datasets", "archive (2)", "scan_doc_rotation")
MODEL_DIR = os.path.join(BACKEND_DIR, "models", "trained")
MODEL_FILE = os.path.join(MODEL_DIR, "rotation_model.pth")
REPORT_FILE = os.path.join(MODEL_DIR, "rotation_training_report.json")

os.makedirs(MODEL_DIR, exist_ok=True)


def load_dataset():
    """Load images and rotation angle labels."""
    logger.info("Loading dataset...")

    images_dir = os.path.join(DATASET_DIR, "images")
    labels_dir = os.path.join(DATASET_DIR, "labels")

    # Load train/test splits
    with open(os.path.join(DATASET_DIR, "train_list.json"), "r") as f:
        train_list = json.load(f)
    with open(os.path.join(DATASET_DIR, "test_list.json"), "r") as f:
        test_list = json.load(f)

    logger.info(f"Train: {len(train_list)} images, Test: {len(test_list)} images")

    def load_split(file_list):
        images = []
        angles = []
        skipped = 0
        for fname in file_list:
            img_path = os.path.join(images_dir, fname)
            label_name = os.path.splitext(fname)[0] + ".txt"
            label_path = os.path.join(labels_dir, label_name)

            if not os.path.exists(img_path):
                skipped += 1
                continue

            # Load image — resize to 128x128 for efficiency
            img = Image.open(img_path).convert("L")  # grayscale
            img = img.resize((128, 128), Image.LANCZOS)
            img_arr = np.array(img, dtype=np.float32) / 255.0

            # Load rotation angle
            if os.path.exists(label_path):
                with open(label_path, "r") as f:
                    angle = float(f.read().strip())
            else:
                angle = 0.0

            images.append(img_arr)
            angles.append(angle)

        if skipped:
            logger.warning(f"Skipped {skipped} files (not found)")
        return np.array(images), np.array(angles, dtype=np.float32)

    X_train, y_train = load_split(train_list)
    X_test, y_test = load_split(test_list)

    logger.info(f"Train: {X_train.shape}, angles range: [{y_train.min():.2f}, {y_train.max():.2f}]")
    logger.info(f"Test: {X_test.shape}, angles range: [{y_test.min():.2f}, {y_test.max():.2f}]")

    return X_train, y_train, X_test, y_test


def train_with_pytorch(X_train, y_train, X_test, y_test):
    """Train a lightweight CNN for rotation angle prediction using PyTorch."""
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import TensorDataset, DataLoader

    logger.info("=" * 60)
    logger.info("Training CNN Rotation Predictor (PyTorch)")
    logger.info("=" * 60)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Device: {device}")

    # Prepare tensors — add channel dimension [B, 1, H, W]
    X_train_t = torch.FloatTensor(X_train).unsqueeze(1)
    y_train_t = torch.FloatTensor(y_train).unsqueeze(1)
    X_test_t = torch.FloatTensor(X_test).unsqueeze(1)
    y_test_t = torch.FloatTensor(y_test).unsqueeze(1)

    train_ds = TensorDataset(X_train_t, y_train_t)
    train_loader = DataLoader(train_ds, batch_size=32, shuffle=True)

    # Lightweight CNN
    class RotationCNN(nn.Module):
        def __init__(self):
            super().__init__()
            self.features = nn.Sequential(
                nn.Conv2d(1, 16, 3, padding=1),
                nn.BatchNorm2d(16),
                nn.ReLU(),
                nn.MaxPool2d(2),            # 64x64

                nn.Conv2d(16, 32, 3, padding=1),
                nn.BatchNorm2d(32),
                nn.ReLU(),
                nn.MaxPool2d(2),            # 32x32

                nn.Conv2d(32, 64, 3, padding=1),
                nn.BatchNorm2d(64),
                nn.ReLU(),
                nn.MaxPool2d(2),            # 16x16

                nn.Conv2d(64, 128, 3, padding=1),
                nn.BatchNorm2d(128),
                nn.ReLU(),
                nn.AdaptiveAvgPool2d(4),    # 4x4
            )
            self.regressor = nn.Sequential(
                nn.Flatten(),
                nn.Linear(128 * 4 * 4, 256),
                nn.ReLU(),
                nn.Dropout(0.3),
                nn.Linear(256, 64),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(64, 1)
            )

        def forward(self, x):
            x = self.features(x)
            x = self.regressor(x)
            return x

    model = RotationCNN().to(device)
    total_params = sum(p.numel() for p in model.parameters())
    logger.info(f"Model parameters: {total_params:,}")

    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=10, factor=0.5)

    # Training loop
    epochs = 80
    best_test_mae = float("inf")
    history = {"train_loss": [], "test_mae": []}

    for epoch in range(1, epochs + 1):
        model.train()
        epoch_loss = 0.0
        batches = 0

        for batch_X, batch_y in train_loader:
            batch_X, batch_y = batch_X.to(device), batch_y.to(device)
            optimizer.zero_grad()
            pred = model(batch_X)
            loss = criterion(pred, batch_y)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
            batches += 1

        avg_loss = epoch_loss / batches

        # Evaluate on test set
        model.eval()
        with torch.no_grad():
            test_pred = model(X_test_t.to(device))
            test_mae = torch.abs(test_pred.cpu() - y_test_t).mean().item()
            test_mse = ((test_pred.cpu() - y_test_t) ** 2).mean().item()

        scheduler.step(test_mae)
        history["train_loss"].append(round(avg_loss, 6))
        history["test_mae"].append(round(test_mae, 4))

        if test_mae < best_test_mae:
            best_test_mae = test_mae
            torch.save(model.state_dict(), MODEL_FILE)

        if epoch % 10 == 0 or epoch == 1:
            lr = optimizer.param_groups[0]["lr"]
            logger.info(
                f"Epoch {epoch:3d}/{epochs} | "
                f"Loss: {avg_loss:.6f} | "
                f"Test MAE: {test_mae:.4f}° | "
                f"Test MSE: {test_mse:.4f} | "
                f"LR: {lr:.6f}"
            )

    # Final evaluation
    model.load_state_dict(torch.load(MODEL_FILE, weights_only=True))
    model.eval()
    with torch.no_grad():
        final_pred = model(X_test_t.to(device)).cpu().numpy().flatten()
        final_true = y_test_t.numpy().flatten()

    final_mae = np.abs(final_pred - final_true).mean()
    final_mse = ((final_pred - final_true) ** 2).mean()
    final_rmse = np.sqrt(final_mse)

    logger.info("=" * 60)
    logger.info("FINAL TEST RESULTS")
    logger.info(f"MAE:  {final_mae:.4f}°")
    logger.info(f"MSE:  {final_mse:.4f}")
    logger.info(f"RMSE: {final_rmse:.4f}°")
    logger.info("=" * 60)

    # Sample predictions
    logger.info("Sample predictions (first 10):")
    for i in range(min(10, len(final_pred))):
        logger.info(f"  True: {final_true[i]:+.3f}° → Pred: {final_pred[i]:+.3f}° (err: {abs(final_true[i]-final_pred[i]):.3f}°)")

    return {
        "final_mae": round(float(final_mae), 4),
        "final_mse": round(float(final_mse), 4),
        "final_rmse": round(float(final_rmse), 4),
        "best_test_mae": round(float(best_test_mae), 4),
        "epochs": epochs,
        "total_params": total_params,
        "history": history
    }


def train_with_sklearn(X_train, y_train, X_test, y_test):
    """Fallback: train with scikit-learn (SVR) if PyTorch is unavailable."""
    from sklearn.svm import SVR
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import mean_absolute_error, mean_squared_error

    logger.info("=" * 60)
    logger.info("Training SVR Rotation Predictor (scikit-learn fallback)")
    logger.info("=" * 60)

    # Flatten images
    X_train_flat = X_train.reshape(len(X_train), -1)
    X_test_flat = X_test.reshape(len(X_test), -1)

    scaler = StandardScaler()
    X_train_flat = scaler.fit_transform(X_train_flat)
    X_test_flat = scaler.transform(X_test_flat)

    model = SVR(kernel="rbf", C=1.0, epsilon=0.1)
    model.fit(X_train_flat, y_train)

    pred = model.predict(X_test_flat)
    mae = mean_absolute_error(y_test, pred)
    mse = mean_squared_error(y_test, pred)
    rmse = np.sqrt(mse)

    logger.info(f"Test MAE:  {mae:.4f}°")
    logger.info(f"Test MSE:  {mse:.4f}")
    logger.info(f"Test RMSE: {rmse:.4f}°")

    import pickle
    sklearn_model_path = os.path.join(MODEL_DIR, "rotation_model_sklearn.pkl")
    with open(sklearn_model_path, "wb") as f:
        pickle.dump({"model": model, "scaler": scaler}, f)

    return {
        "final_mae": round(float(mae), 4),
        "final_mse": round(float(mse), 4),
        "final_rmse": round(float(rmse), 4),
        "method": "sklearn_svr"
    }


def main():
    start_time = time.time()
    logger.info("FormSense AI — Rotation Prediction Training")
    logger.info(f"Dataset: {DATASET_DIR}")

    X_train, y_train, X_test, y_test = load_dataset()

    # Try PyTorch first, fallback to sklearn
    try:
        import torch
        metrics = train_with_pytorch(X_train, y_train, X_test, y_test)
        method = "pytorch_cnn"
    except ImportError:
        logger.warning("PyTorch not available, using scikit-learn fallback")
        metrics = train_with_sklearn(X_train, y_train, X_test, y_test)
        method = "sklearn_svr"

    elapsed = round(time.time() - start_time, 2)

    report = {
        "task": "Document Rotation Prediction",
        "dataset": "archive (2) — scan_doc_rotation",
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "method": method,
        "training_time_seconds": elapsed,
        **metrics
    }

    with open(REPORT_FILE, "w") as f:
        json.dump(report, f, indent=2, default=str)

    logger.info(f"\nTraining completed in {elapsed}s")
    logger.info(f"Report saved: {REPORT_FILE}")


if __name__ == "__main__":
    main()
