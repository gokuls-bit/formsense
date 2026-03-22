import time
import logging
from fastapi import FastAPI, Depends, UploadFile, File, Form, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.config import settings
from app.models.database import engine, Base, get_db
from app.models.schemas import DocumentORM, DocumentResponse, StatsResponse
from app.services.document_service import DocumentService
from app.utils.exceptions import CustomHTTPException

from app.modules.ocr_engine import ocr_engine
from app.modules.nlp_processor import nlp_processor
from app.modules.classifier import classifier

# 1. Logging setup
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("api_gateway")

# 2. Initialize App
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    description="Industrial-grade API for Automated Document Intelligence",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 3. Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    logger.info(f"Incoming Request: {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.info(f"Completed Request: {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.3f}s")
    return response

# 4. Global Exception Handlers
@app.exception_handler(CustomHTTPException)
async def custom_http_exception_handler(request: Request, exc: CustomHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "message": exc.detail},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled Server Error")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"status": "error", "message": "An unexpected internal server error occurred.", "details": str(exc)},
    )

# 5. Database Startup
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database synchronized and connection pooled successfully.")

# 6. API Routers
@app.get("/api/health")
async def health_check():
    return {
        "status": "success",
        "version": settings.API_VERSION,
        "services": {
            "api": "operational",
            "ocr_easyocr": "available" if getattr(ocr_engine, 'is_available', False) else "down",
            "ocr_tesseract": "available" if getattr(ocr_engine, 'has_cv2', False) else "mock_only",
            "nlp_spacy": "available" if getattr(nlp_processor, 'has_spacy', False) else "mock_only",
            "classifier": "operational"
        }
    }

@app.post("/api/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    accuracy: str = Form(None),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Business logic fully handled in service layer
        doc = await DocumentService.process_document(file=file, accuracy=accuracy or "standard", db=db)
        return doc
    except Exception as e:
        logger.error(f"Error handling upload endpoint: {e}")
        raise

@app.get("/api/documents")
async def get_documents(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    docs = await DocumentService.get_all_documents(db, limit=limit, offset=skip)
    return {"status": "success", "skip": skip, "limit": limit, "documents": docs}

@app.get("/api/documents/{doc_id}", response_model=DocumentResponse)
async def get_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    return await DocumentService.get_document_by_id(doc_id, db)

@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    await DocumentService.delete_document(doc_id, db)
    return {"status": "success", "message": f"Document {doc_id} successfully deleted."}

@app.get("/api/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    # Calculate stats robustly mapping ORM directly
    result = await db.execute(select(DocumentORM.document_category, DocumentORM.processing_time, DocumentORM.category_confidence))
    docs = result.all()
    
    total = len(docs)
    if total == 0:
         return {"total_documents": 0, "categories": {}, "avg_processing_time": 0.0, "avg_confidence": 0.0}
         
    categories: Dict[str, int] = {}
    total_time = 0.0
    total_conf = 0.0
    
    for doc in docs:
        categories[doc.document_category] = categories.get(doc.document_category, 0) + 1
        total_time += doc.processing_time
        total_conf += doc.category_confidence
        
    return {
        "status": "success",
        "total_documents": total,
        "categories": categories,
        "avg_processing_time": round(total_time / total, 2),
        "avg_confidence": round(total_conf / total, 2)
    }
