"""
FormSense AI - OCR Module
Handles image preprocessing and text extraction from documents
Uses OpenCV for preprocessing and EasyOCR/Tesseract for text extraction
"""

import os
import re
import logging
import tempfile
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

# Try importing OCR libraries
try:
    import easyocr
    EASYOCR_AVAILABLE = True
    # Initialize EasyOCR reader (lazy load)
    _easyocr_reader = None
except ImportError:
    EASYOCR_AVAILABLE = False
    logger.warning("EasyOCR not available")

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.warning("pytesseract not available")

try:
    from PIL import Image, ImageFilter, ImageEnhance
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False


def get_easyocr_reader():
    """Lazy-load EasyOCR reader"""
    global _easyocr_reader
    if _easyocr_reader is None and EASYOCR_AVAILABLE:
        _easyocr_reader = easyocr.Reader(['en'], gpu=False)
    return _easyocr_reader


def preprocess_image(image: Image.Image) -> Image.Image:
    """
    Preprocess document image for better OCR results.
    Steps: Grayscale → Contrast Enhancement → Sharpening → Noise Reduction
    """
    if not PIL_AVAILABLE:
        return image
    
    try:
        # Convert to grayscale
        if image.mode != 'L':
            image = image.convert('L')
        
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.5)
        
        # Sharpen
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(2.0)
        
        # Apply slight blur to reduce noise
        image = image.filter(ImageFilter.MedianFilter(size=3))
        
        # Resize if too small (improves OCR accuracy)
        width, height = image.size
        if width < 1000:
            ratio = 1000 / width
            image = image.resize((int(width * ratio), int(height * ratio)), Image.LANCZOS)
        
        logger.info("Image preprocessing completed successfully")
        return image
        
    except Exception as e:
        logger.error(f"Image preprocessing failed: {e}")
        return image


def extract_text_from_image(image_path: str) -> Tuple[str, float]:
    """
    Extract text from an image file using available OCR engine.
    Returns: (extracted_text, confidence_score)
    """
    try:
        image = Image.open(image_path)
        
        # Preprocess the image
        processed_image = preprocess_image(image)
        
        # Try EasyOCR first (generally better results)
        if EASYOCR_AVAILABLE:
            return _extract_with_easyocr(image_path)
        
        # Fall back to Tesseract
        if TESSERACT_AVAILABLE:
            return _extract_with_tesseract(processed_image)
        
        # If no OCR engine is available, return empty
        logger.warning("No OCR engine available. Install easyocr or pytesseract.")
        return ("No OCR engine available. Please install easyocr or pytesseract.", 0.0)
        
    except Exception as e:
        logger.error(f"Text extraction failed: {e}")
        return (f"Error extracting text: {str(e)}", 0.0)


def _extract_with_easyocr(image_path: str) -> Tuple[str, float]:
    """Extract text using EasyOCR"""
    try:
        reader = get_easyocr_reader()
        if reader is None:
            return ("EasyOCR reader not initialized", 0.0)
        
        results = reader.readtext(image_path)
        
        if not results:
            return ("No text detected in document", 0.0)
        
        # Combine text results
        text_parts = []
        confidences = []
        
        for (bbox, text, confidence) in results:
            text_parts.append(text)
            confidences.append(confidence)
        
        full_text = " ".join(text_parts)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        logger.info(f"EasyOCR extracted {len(text_parts)} text segments, avg confidence: {avg_confidence:.2f}")
        return (full_text, avg_confidence)
        
    except Exception as e:
        logger.error(f"EasyOCR extraction failed: {e}")
        return (f"EasyOCR error: {str(e)}", 0.0)


def _extract_with_tesseract(image: Image.Image) -> Tuple[str, float]:
    """Extract text using Tesseract OCR"""
    try:
        # Get text with confidence data
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
        
        text_parts = []
        confidences = []
        
        for i, word in enumerate(data['text']):
            if word.strip():
                text_parts.append(word)
                conf = int(data['conf'][i])
                if conf > 0:
                    confidences.append(conf / 100.0)
        
        full_text = " ".join(text_parts)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        logger.info(f"Tesseract extracted {len(text_parts)} words, avg confidence: {avg_confidence:.2f}")
        return (full_text, avg_confidence)
        
    except Exception as e:
        logger.error(f"Tesseract extraction failed: {e}")
        return (f"Tesseract error: {str(e)}", 0.0)


def extract_text_from_pdf(pdf_path: str) -> Tuple[str, float]:
    """
    Extract text from a PDF file.
    First tries direct text extraction, then falls back to OCR.
    """
    try:
        # Try direct text extraction with PyPDF2
        from PyPDF2 import PdfReader
        
        reader = PdfReader(pdf_path)
        text_parts = []
        
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text.strip())
        
        full_text = "\n".join(text_parts)
        
        if full_text.strip():
            logger.info(f"Extracted text from {len(reader.pages)} PDF pages directly")
            return (full_text, 0.95)  # High confidence for direct extraction
        
        # If no text found, try OCR on PDF pages
        logger.info("No text found in PDF, attempting OCR...")
        return _ocr_pdf_pages(pdf_path)
        
    except Exception as e:
        logger.error(f"PDF text extraction failed: {e}")
        return (f"Error extracting from PDF: {str(e)}", 0.0)


def _ocr_pdf_pages(pdf_path: str) -> Tuple[str, float]:
    """OCR individual pages of a PDF"""
    try:
        from pdf2image import convert_from_path
        
        images = convert_from_path(pdf_path, dpi=200)
        all_text = []
        all_confidences = []
        
        for i, img in enumerate(images):
            # Save temp image
            temp_path = os.path.join(tempfile.gettempdir(), f"formsense_page_{i}.png")
            img.save(temp_path)
            
            text, conf = extract_text_from_image(temp_path)
            all_text.append(text)
            all_confidences.append(conf)
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
        full_text = "\n".join(all_text)
        avg_conf = sum(all_confidences) / len(all_confidences) if all_confidences else 0.0
        
        return (full_text, avg_conf)
        
    except ImportError:
        logger.error("pdf2image not installed for OCR-based PDF extraction")
        return ("pdf2image not installed for OCR-based PDF extraction", 0.0)
    except Exception as e:
        logger.error(f"PDF OCR failed: {e}")
        return (f"PDF OCR error: {str(e)}", 0.0)
