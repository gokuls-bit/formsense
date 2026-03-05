"""
FormSense AI - Pydantic Data Models
Defines request/response schemas for the API
"""

from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class DocumentResponse(BaseModel):
    """Response schema for processed documents"""
    id: str
    filename: str
    file_type: str
    file_size: int
    upload_time: str
    
    # OCR Results
    extracted_text: str
    text_confidence: Optional[float] = None
    
    # Classification Results
    document_category: str
    category_confidence: float
    
    # NLP Results
    entities: dict
    summary: str
    key_fields: dict
    
    # Processing metadata
    processing_time: float
    status: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    timestamp: str
    services: dict


class ClassificationResult(BaseModel):
    """Document classification result"""
    category: str
    confidence: float
    all_categories: dict


class EntityResult(BaseModel):
    """Named entity extraction result"""
    names: List[str] = []
    dates: List[str] = []
    amounts: List[str] = []
    ids: List[str] = []
    organizations: List[str] = []
    locations: List[str] = []
    emails: List[str] = []
    phones: List[str] = []
    other: List[str] = []
