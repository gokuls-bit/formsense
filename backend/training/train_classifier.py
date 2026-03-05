"""
FormSense AI — Document Classifier Training
=============================================
Pipeline:
  1. OCR all 371 document images from archive(3)
  2. Auto-label using the keyword-based classifier
  3. Train TF-IDF + SVM classifier on the extracted text
  4. Evaluate with cross-validation
  5. Save trained model + vectorizer to disk
"""

import os
import sys
import json
import time
import pickle
import logging
from pathlib import Path

import numpy as np
from PIL import Image

# Add project root to path so we can import modules
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

from app.modules.ocr_engine import extract_text_from_image
from app.modules.classifier import classify_document, DOCUMENT_CATEGORIES

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ClassifierTraining")

# ── Paths ──────────────────────────────────────────────────
DATASET_DIR = os.path.join(BACKEND_DIR, "..", "..", "datasets", "archive (3)")
MODEL_DIR = os.path.join(BACKEND_DIR, "models", "trained")
CACHE_FILE = os.path.join(MODEL_DIR, "ocr_cache.json")
MODEL_FILE = os.path.join(MODEL_DIR, "classifier_model.pkl")
VECTORIZER_FILE = os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")
REPORT_FILE = os.path.join(MODEL_DIR, "training_report.json")

os.makedirs(MODEL_DIR, exist_ok=True)


def step1_ocr_all_images():
    """Extract text from all document images using OCR (with caching)."""
    logger.info("=" * 60)
    logger.info("STEP 1: OCR Text Extraction from Archive(3)")
    logger.info("=" * 60)

    # Load cache if exists
    cache = {}
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r") as f:
            cache = json.load(f)
        logger.info(f"Loaded OCR cache with {len(cache)} entries")

    # Gather image files
    image_files = sorted([
        f for f in os.listdir(DATASET_DIR)
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"))
    ])
    logger.info(f"Found {len(image_files)} images in dataset")

    results = {}
    new_extractions = 0

    for i, fname in enumerate(image_files):
        if fname in cache and cache[fname].get("text"):
            results[fname] = cache[fname]
            continue

        filepath = os.path.join(DATASET_DIR, fname)
        try:
            text, confidence = extract_text_from_image(filepath)
            results[fname] = {
                "text": text,
                "confidence": round(confidence, 4)
            }
            new_extractions += 1

            if (i + 1) % 10 == 0 or i == 0:
                logger.info(f"  [{i+1}/{len(image_files)}] {fname}: {len(text)} chars, conf={confidence:.2f}")

        except Exception as e:
            logger.warning(f"  [{i+1}] FAILED {fname}: {e}")
            results[fname] = {"text": "", "confidence": 0.0}

        # Save cache periodically
        if new_extractions % 25 == 0 and new_extractions > 0:
            with open(CACHE_FILE, "w") as f:
                json.dump(results, f)

    # Final cache save
    with open(CACHE_FILE, "w") as f:
        json.dump(results, f)
    logger.info(f"OCR complete. New extractions: {new_extractions}, Total: {len(results)}")

    return results


def step2_auto_label(ocr_results):
    """Use keyword classifier to auto-label documents."""
    logger.info("=" * 60)
    logger.info("STEP 2: Auto-Labeling with Keyword Classifier")
    logger.info("=" * 60)

    labeled_data = []
    label_counts = {}

    for fname, data in ocr_results.items():
        text = data.get("text", "")
        if not text or len(text.strip()) < 10:
            continue

        category, confidence, scores = classify_document(text)

        # Only keep samples with reasonable confidence
        if confidence >= 0.05:
            labeled_data.append({
                "filename": fname,
                "text": text,
                "label": category,
                "confidence": confidence
            })
            label_counts[category] = label_counts.get(category, 0) + 1

    logger.info(f"Labeled {len(labeled_data)} documents (from {len(ocr_results)} total)")
    logger.info(f"Label distribution: {json.dumps(label_counts, indent=2)}")

    # Also include low-confidence as "Other"
    for fname, data in ocr_results.items():
        text = data.get("text", "")
        if not text or len(text.strip()) < 10:
            continue
        already_has = any(d["filename"] == fname for d in labeled_data)
        if not already_has:
            labeled_data.append({
                "filename": fname,
                "text": text,
                "label": "Other",
                "confidence": 0.0
            })
            label_counts["Other"] = label_counts.get("Other", 0) + 1

    logger.info(f"Final dataset: {len(labeled_data)} samples")
    logger.info(f"Final distribution: {json.dumps(label_counts, indent=2)}")

    return labeled_data


def step3_train_model(labeled_data):
    """Train TF-IDF + SVM classifier."""
    logger.info("=" * 60)
    logger.info("STEP 3: Training TF-IDF + SVM Classifier")
    logger.info("=" * 60)

    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.svm import LinearSVC
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import cross_val_score, StratifiedKFold
    from sklearn.preprocessing import LabelEncoder
    from sklearn.pipeline import Pipeline
    from sklearn.metrics import classification_report

    # Prepare data
    texts = [d["text"] for d in labeled_data]
    labels = [d["label"] for d in labeled_data]

    logger.info(f"Training samples: {len(texts)}")
    logger.info(f"Unique labels: {set(labels)}")

    # TF-IDF Vectorizer
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        stop_words="english",
        min_df=2,
        max_df=0.95,
        sublinear_tf=True
    )

    # Encode labels
    le = LabelEncoder()
    y = le.fit_transform(labels)

    # Transform text to TF-IDF features
    X = vectorizer.fit_transform(texts)
    logger.info(f"TF-IDF matrix shape: {X.shape}")

    # Train SVM classifier
    svm_model = LinearSVC(
        C=1.0,
        max_iter=5000,
        class_weight="balanced",
        random_state=42
    )

    # Cross-validation
    n_splits = min(5, min(np.bincount(y)))
    if n_splits >= 2:
        cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
        cv_scores = cross_val_score(svm_model, X, y, cv=cv, scoring="accuracy")
        logger.info(f"Cross-validation accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
        logger.info(f"Per-fold: {[round(s, 4) for s in cv_scores]}")
    else:
        cv_scores = np.array([0.0])
        logger.warning("Not enough samples per class for cross-validation")

    # Train on full dataset
    svm_model.fit(X, y)
    train_pred = svm_model.predict(X)
    train_accuracy = (train_pred == y).mean()
    logger.info(f"Training accuracy: {train_accuracy:.4f}")

    # Classification report
    report_text = classification_report(y, train_pred, target_names=le.classes_, zero_division=0)
    logger.info(f"\nClassification Report:\n{report_text}")

    # Save models
    model_data = {
        "svm_model": svm_model,
        "label_encoder": le,
        "classes": list(le.classes_),
    }
    with open(MODEL_FILE, "wb") as f:
        pickle.dump(model_data, f)
    logger.info(f"Model saved: {MODEL_FILE}")

    with open(VECTORIZER_FILE, "wb") as f:
        pickle.dump(vectorizer, f)
    logger.info(f"Vectorizer saved: {VECTORIZER_FILE}")

    return {
        "train_accuracy": round(float(train_accuracy), 4),
        "cv_accuracy_mean": round(float(cv_scores.mean()), 4),
        "cv_accuracy_std": round(float(cv_scores.std()), 4),
        "n_samples": len(texts),
        "n_features": X.shape[1],
        "classes": list(le.classes_),
        "classification_report": report_text
    }


def main():
    """Full training pipeline."""
    start_time = time.time()
    logger.info("FormSense AI — Document Classifier Training")
    logger.info(f"Dataset: {DATASET_DIR}")
    logger.info(f"Output: {MODEL_DIR}")

    # Step 1: OCR
    ocr_results = step1_ocr_all_images()

    # Step 2: Auto-label
    labeled_data = step2_auto_label(ocr_results)

    if len(labeled_data) < 5:
        logger.error("Not enough labeled data to train. Need at least 5 samples.")
        return

    # Step 3: Train
    metrics = step3_train_model(labeled_data)

    # Save report
    elapsed = round(time.time() - start_time, 2)
    report = {
        "task": "Document Classifier Training",
        "dataset": "archive (3)",
        "total_images": len(ocr_results),
        "labeled_samples": len(labeled_data),
        "training_time_seconds": elapsed,
        **metrics
    }
    with open(REPORT_FILE, "w") as f:
        json.dump(report, f, indent=2)

    logger.info("=" * 60)
    logger.info("TRAINING COMPLETE")
    logger.info(f"Time: {elapsed}s")
    logger.info(f"Accuracy: {metrics['train_accuracy']}")
    logger.info(f"CV Accuracy: {metrics['cv_accuracy_mean']} ± {metrics['cv_accuracy_std']}")
    logger.info(f"Classes: {metrics['classes']}")
    logger.info(f"Report saved: {REPORT_FILE}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
