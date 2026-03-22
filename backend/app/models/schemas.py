from sqlalchemy import Column, String, Integer, Float, JSON, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

from .database import Base

class DocumentORM(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    document_category = Column(String, nullable=False)
    category_confidence = Column(Float, nullable=False)
    summary = Column(String, nullable=True)
    extracted_text = Column(String, nullable=True)
    processing_time = Column(Float, nullable=False)
    entities = Column(JSON, nullable=True)
    key_fields = Column(JSON, nullable=True)
    status = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    document_category: str
    category_confidence: float
    summary: Optional[str] = None
    extracted_text: Optional[str] = None
    processing_time: float
    entities: Optional[Dict[str, Any]] = None
    key_fields: Optional[Dict[str, Any]] = None
    status: str

    class Config:
        orm_mode = True

class StatsResponse(BaseModel):
    total_documents: int
    categories: Dict[str, int]
    avg_processing_time: float
    avg_confidence: float
