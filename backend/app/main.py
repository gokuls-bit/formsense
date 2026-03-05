"""
FormSense AI - Main FastAPI Application
Automated Form & Document Intelligence System
Backend API server handling document upload, OCR, classification, and NLP processing
"""

import os
import time
import uuid
import shutil
import logging
from datetime import datetime
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from app.models.schemas import DocumentResponse, HealthResponse
from app.modules.ocr_engine import extract_text_from_image, extract_text_from_pdf
from app.modules.classifier import classify_document, get_category_description
from app.modules.nlp_processor import extract_entities, generate_summary, extract_key_fields

# ==========================================
# LOGGING CONFIGURATION
# ==========================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("FormSenseAI")

# Upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Frontend directory
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend")
os.makedirs(FRONTEND_DIR, exist_ok=True)

# ==========================================
# LIFESPAN (replaces deprecated on_event)
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("FormSense AI - Automated Form & Document Intelligence")
    logger.info("Version 1.0.0")
    logger.info(f"Upload directory: {UPLOAD_DIR}")
    logger.info("API documentation: http://localhost:8000/docs")
    logger.info("Frontend: http://localhost:8000/app")
    logger.info("=" * 60)
    yield
    logger.info("FormSense AI shutting down...")

# ==========================================
# APPLICATION SETUP
# ==========================================
app = FastAPI(
    title="FormSense AI",
    description="Automated Form & Document Intelligence - AI-powered document processing, classification, and information extraction",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration (allow frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Allowed file types
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

# In-memory document store (for demo purposes)
document_store = {}



# ==========================================
# API ENDPOINTS
# ==========================================

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - API information"""
    return {
        "application": "FormSense AI",
        "description": "Automated Form & Document Intelligence System",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "upload": "/api/upload",
            "documents": "/api/documents",
            "docs": "/docs"
        }
    }


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Check the health status of all services"""
    
    # Check OCR availability
    from app.modules.ocr_engine import EASYOCR_AVAILABLE, TESSERACT_AVAILABLE
    from app.modules.nlp_processor import SPACY_AVAILABLE
    
    services = {
        "api": "operational",
        "ocr_easyocr": "available" if EASYOCR_AVAILABLE else "not installed",
        "ocr_tesseract": "available" if TESSERACT_AVAILABLE else "not installed",
        "nlp_spacy": "available" if SPACY_AVAILABLE else "not installed",
        "classifier": "operational",
        "storage": "operational"
    }
    
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.now().isoformat(),
        services=services
    )


@app.post("/api/upload", tags=["Documents"])
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document for processing.
    Supports: PDF, PNG, JPG, JPEG, TIFF, BMP, WEBP
    
    Pipeline:
    1. Validate and save file
    2. Extract text using OCR
    3. Classify document type
    4. Extract entities using NLP
    5. Generate summary
    6. Return structured results
    """
    start_time = time.time()
    
    # ---- Step 1: Validate file ----
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)} MB"
        )
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")
    
    # ---- Step 2: Save file ----
    doc_id = str(uuid.uuid4())[:12]
    safe_filename = f"{doc_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    try:
        with open(file_path, "wb") as f:
            f.write(content)
        logger.info(f"File saved: {safe_filename} ({file_size} bytes)")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # ---- Step 3: Extract text using OCR ----
    try:
        if file_ext == ".pdf":
            extracted_text, text_confidence = extract_text_from_pdf(file_path)
        else:
            extracted_text, text_confidence = extract_text_from_image(file_path)
        
        logger.info(f"Text extracted: {len(extracted_text)} chars, confidence: {text_confidence:.2f}")
    except Exception as e:
        logger.error(f"OCR failed: {e}")
        extracted_text = f"OCR extraction failed: {str(e)}"
        text_confidence = 0.0
    
    # ---- Step 4: Classify document ----
    try:
        category, cat_confidence, all_scores = classify_document(extracted_text)
        logger.info(f"Classification: {category} (confidence: {cat_confidence:.4f})")
    except Exception as e:
        logger.error(f"Classification failed: {e}")
        category = "Other"
        cat_confidence = 0.0
        all_scores = {}
    
    # ---- Step 5: Extract entities ----
    try:
        entities = extract_entities(extracted_text)
    except Exception as e:
        logger.error(f"Entity extraction failed: {e}")
        entities = {}
    
    # ---- Step 6: Generate summary ----
    try:
        summary = generate_summary(extracted_text)
    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        summary = "Summary generation failed."
    
    # ---- Step 7: Extract key fields ----
    try:
        key_fields = extract_key_fields(extracted_text, category)
    except Exception as e:
        logger.error(f"Key field extraction failed: {e}")
        key_fields = {}
    
    processing_time = round(time.time() - start_time, 3)
    
    # Build response
    result = {
        "id": doc_id,
        "filename": file.filename,
        "file_type": file_ext,
        "file_size": file_size,
        "upload_time": datetime.now().isoformat(),
        "extracted_text": extracted_text,
        "text_confidence": round(text_confidence, 4),
        "document_category": category,
        "category_confidence": round(cat_confidence, 4),
        "category_description": get_category_description(category),
        "all_category_scores": all_scores,
        "entities": entities,
        "summary": summary,
        "key_fields": key_fields,
        "processing_time": processing_time,
        "status": "success"
    }
    
    # Store in memory
    document_store[doc_id] = result
    
    logger.info(f"Document processed successfully: {doc_id} in {processing_time}s")
    return result


@app.get("/api/documents", tags=["Documents"])
async def list_documents():
    """List all processed documents"""
    docs = []
    for doc_id, doc in document_store.items():
        docs.append({
            "id": doc["id"],
            "filename": doc["filename"],
            "file_type": doc["file_type"],
            "document_category": doc["document_category"],
            "category_confidence": doc["category_confidence"],
            "upload_time": doc["upload_time"],
            "status": doc["status"]
        })
    return {"documents": docs, "total": len(docs)}


@app.get("/api/documents/{doc_id}", tags=["Documents"])
async def get_document(doc_id: str):
    """Get detailed results for a specific document"""
    if doc_id not in document_store:
        raise HTTPException(status_code=404, detail="Document not found")
    return document_store[doc_id]


@app.delete("/api/documents/{doc_id}", tags=["Documents"])
async def delete_document(doc_id: str):
    """Delete a processed document"""
    if doc_id not in document_store:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Remove from store
    doc = document_store.pop(doc_id)
    
    # Try to remove the file
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{doc['filename']}")
    if os.path.exists(file_path):
        os.remove(file_path)
    
    return {"message": "Document deleted successfully", "id": doc_id}


@app.get("/api/stats", tags=["Analytics"])
async def get_stats():
    """Get processing statistics"""
    if not document_store:
        return {
            "total_documents": 0,
            "categories": {},
            "avg_processing_time": 0,
            "avg_confidence": 0
        }
    
    categories = {}
    processing_times = []
    confidences = []
    
    for doc in document_store.values():
        cat = doc["document_category"]
        categories[cat] = categories.get(cat, 0) + 1
        processing_times.append(doc["processing_time"])
        confidences.append(doc["category_confidence"])
    
    return {
        "total_documents": len(document_store),
        "categories": categories,
        "avg_processing_time": round(sum(processing_times) / len(processing_times), 3),
        "avg_confidence": round(sum(confidences) / len(confidences), 4)
    }


# ==========================================
# SERVE FRONTEND
# ==========================================

# Serve static frontend files (CSS, JS)
if os.path.isdir(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="frontend_static")

@app.get("/app", tags=["Frontend"], include_in_schema=False)
async def serve_frontend():
    """Serve the FormSense AI frontend"""
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path, media_type="text/html")
    return JSONResponse(
        status_code=404,
        content={"error": "Frontend not found. Place index.html in the frontend/ directory."}
    )
