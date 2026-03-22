import asyncio
import logging

logger = logging.getLogger(__name__)

class OCREngine:
    def __init__(self):
        self.is_available = True
        try:
            # Attempt to import real libraries if user has them installed
            import cv2
            import pytesseract
            self.has_cv2 = True
        except ImportError:
            logger.warning("cv2 or pytesseract not found. Falling back to mock OCR engine.")
            self.has_cv2 = False
            
    async def process_image(self, file_path: str) -> str:
        """
        Simulate OCR Engine Pipeline:
        1. OpenCV preprocessing
        2. Tesseract/EasyOCR extraction
        """
        # Preprocessing simulation
        await asyncio.sleep(0.5)
        
        # OCR extraction simulation
        await asyncio.sleep(1.0)
        
        return "Extracted text content from the document. Invoice #1024. Total Amount: $1,250.00. Date: 2026-03-24."

ocr_engine = OCREngine()
