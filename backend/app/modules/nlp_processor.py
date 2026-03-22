import asyncio
import logging

logger = logging.getLogger(__name__)

class NLPProcessor:
    def __init__(self):
        self.is_available = True
        try:
            import spacy
            self.has_spacy = True
        except ImportError:
            logger.warning("spacy not found. Falling back to mock NLP processor.")
            self.has_spacy = False
            
    async def extract_entities(self, text: str) -> dict:
        """ Simulate Entity Extraction """
        await asyncio.sleep(0.5)
        return {
            "GPE": ["New York"],
            "DATE": ["2026-03-24"],
            "MONEY": ["$1,250.00"],
            "ORG": ["FormSense AI"]
        }
        
    async def summarize(self, text: str) -> str:
        """ Simulate Text Summarization """
        await asyncio.sleep(0.5)
        return "This document is an invoice detailing a transaction amounting to $1,250.00 on 2026-03-24."
    
    async def clean_text(self, text: str) -> str:
        await asyncio.sleep(0.1)
        return text.strip().replace("\n", " ")

nlp_processor = NLPProcessor()
