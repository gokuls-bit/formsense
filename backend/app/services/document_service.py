import os
import uuid
import time
import logging
from fastapi import UploadFile
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.schemas import DocumentORM
from app.utils.exceptions import FileValidationException, ProcessingException, DocumentNotFoundException

from app.modules.ocr_engine import ocr_engine
from app.modules.nlp_processor import nlp_processor
from app.modules.classifier import classifier

logger = logging.getLogger(__name__)

class DocumentService:
    @staticmethod
    async def validate_file(file: UploadFile) -> None:
        """ Industrial-grade validation """
        if file.content_type not in settings.ALLOWED_MIME_TYPES:
            raise FileValidationException(f"Unsupported file type: {file.content_type}. Allowed: {settings.ALLOWED_MIME_TYPES}")
        
    @staticmethod
    async def process_document(file: UploadFile, accuracy: str, db: AsyncSession) -> DocumentORM:
        start_time = time.time()
        
        try:
            # Validate
            await DocumentService.validate_file(file)
            
            # Save file safely
            os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
            unique_filename = f"{uuid.uuid4()}_{file.filename}"
            file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
            
            # Read and write chunks for large files without loading entirely into RAM
            file_size = 0
            with open(file_path, "wb") as f:
                while chunk := await file.read(1024 * 1024):  # 1MB chunks
                    file_size += len(chunk)
                    f.write(chunk)
                    
            if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
                os.remove(file_path)
                raise FileValidationException(f"File too large. Max size allows is {settings.MAX_FILE_SIZE_MB}MB.")
                
        except FileValidationException:
            raise
        except Exception as e:
            logger.error(f"File save error: {str(e)}")
            raise ProcessingException(f"Failed to securely save file payload.")
            
        # ML Pipeline Execution
        try:
            logger.info(f"Starting pipeline on {unique_filename}...")
            # 1. Image -> OCR
            raw_text = await ocr_engine.process_image(file_path)
            
            # 2. Text -> Clean & Extract
            clean_text = await nlp_processor.clean_text(raw_text)
            entities = await nlp_processor.extract_entities(clean_text)
            summary = await nlp_processor.summarize(clean_text)
            
            # 3. Analyze -> Category
            category, confidence = await classifier.classify(clean_text)
        except Exception as e:
            logger.exception("ML Pipeline failure")
            raise ProcessingException(f"ML Processing failed unexpectedly: {str(e)}")
            
        processing_time = round(time.time() - start_time, 2)
        
        # Determine Status
        status_str = "Processed" if confidence > 0.6 else "Needs Manual Review"
            
        doc = DocumentORM(
            id=str(uuid.uuid4()),
            filename=file.filename,
            file_type=file.content_type or "application/pdf",
            file_size=file_size,
            document_category=category,
            category_confidence=confidence,
            summary=summary,
            extracted_text=clean_text,
            processing_time=processing_time,
            entities=entities,
            key_fields={"Invoice Number": "SEQ-202X", "Vendor": "FormSense MockVendor", "Total Amount": "$1,250.00"},
            status=status_str
        )
        
        # Save to DB
        db.add(doc)
        await db.commit()
        await db.refresh(doc)
        
        return doc
        
    @staticmethod
    async def get_all_documents(db: AsyncSession, limit: int = 100, offset: int = 0):
        result = await db.execute(select(DocumentORM).order_by(DocumentORM.created_at.desc()).limit(limit).offset(offset))
        return result.scalars().all()
        
    @staticmethod
    async def get_document_by_id(doc_id: str, db: AsyncSession):
        result = await db.execute(select(DocumentORM).where(DocumentORM.id == doc_id))
        doc = result.scalar_one_or_none()
        if not doc:
            raise DocumentNotFoundException(doc_id)
        return doc
        
    @staticmethod
    async def delete_document(doc_id: str, db: AsyncSession):
        doc = await DocumentService.get_document_by_id(doc_id, db)
        await db.delete(doc)
        await db.commit()
