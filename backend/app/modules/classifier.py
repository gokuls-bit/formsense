import asyncio
import logging
import random

logger = logging.getLogger(__name__)

class DocumentClassifier:
    def __init__(self):
        self.is_available = True
        try:
            import sklearn
            self.has_sklearn = True
        except ImportError:
            logger.warning("sklearn not found. Using basic fallback classification logic.")
            self.has_sklearn = False

    async def classify(self, text: str) -> tuple[str, float]:
        """ Simulate document classification """
        await asyncio.sleep(0.5)
        text_lower = text.lower()
        
        if "invoice" in text_lower or "total amount" in text_lower:
            return "Invoice", round(random.uniform(0.85, 0.99), 2)
        elif "tax" in text_lower or "form" in text_lower:
            return "Tax Form", round(random.uniform(0.70, 0.95), 2)
        elif "receipt" in text_lower:
            return "Receipt", round(random.uniform(0.80, 0.98), 2)
        else:
            return "Other Document", round(random.uniform(0.50, 0.80), 2)

classifier = DocumentClassifier()
