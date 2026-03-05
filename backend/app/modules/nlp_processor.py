"""
FormSense AI - NLP Processing Module
Handles entity extraction, summarization, and key field identification
Uses regex patterns and spaCy for Named Entity Recognition (NER)
"""

import re
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

# Try loading spaCy
SPACY_AVAILABLE = False
nlp = None

try:
    import spacy
    try:
        nlp = spacy.load("en_core_web_sm")
        SPACY_AVAILABLE = True
        logger.info("spaCy model loaded successfully")
    except OSError:
        logger.warning("spaCy model 'en_core_web_sm' not found. Using regex-based extraction.")
except ImportError:
    logger.warning("spaCy not installed. Using regex-based extraction.")


# ==========================================
# REGEX PATTERNS FOR ENTITY EXTRACTION
# ==========================================

PATTERNS = {
    "dates": [
        r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',                    # DD/MM/YYYY or MM-DD-YYYY
        r'\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b',                       # YYYY-MM-DD
        r'\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}\b',  # 15 Jan 2024
        r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}\b', # January 15, 2024
        r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b',
    ],
    "amounts": [
        r'(?:Rs\.?|INR|₹|USD|\$|€|£)\s*[\d,]+\.?\d*',             # Rs. 1,000.00 or $100
        r'[\d,]+\.?\d*\s*(?:Rs\.?|INR|USD|rupees|dollars)',         # 1000 Rs or 1000 rupees
        r'\b\d{1,3}(?:,\d{3})*\.\d{2}\b',                          # 1,000.00 (currency-like numbers)
    ],
    "emails": [
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    ],
    "phones": [
        r'\b(?:\+91[\-\s]?)?[6-9]\d{9}\b',                         # Indian mobile
        r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',                      # US format
        r'\b\(\d{3}\)\s?\d{3}[-.\s]?\d{4}\b',                      # (123) 456-7890
    ],
    "ids": [
        r'\b[A-Z]{5}\d{4}[A-Z]\b',                                 # PAN number
        r'\b\d{4}\s?\d{4}\s?\d{4}\b',                              # Aadhaar number
        r'\b[A-Z]{1,2}\d{2}\s?\d{4}\s?\d{4}\b',                   # Passport-like
        r'(?:Invoice|Inv|Receipt|Order|Ref|ID|No|Number)[.\s:#-]*([A-Z0-9-]+)',  # Document numbers
    ],
    "pin_codes": [
        r'\b\d{6}\b',  # Indian PIN code
    ]
}


def extract_entities(text: str) -> Dict[str, List[str]]:
    """
    Extract named entities from document text.
    Uses spaCy NER if available, with regex patterns as supplementary.
    
    Returns dict with keys: names, dates, amounts, ids, organizations, locations, emails, phones
    """
    entities = {
        "names": [],
        "dates": [],
        "amounts": [],
        "ids": [],
        "organizations": [],
        "locations": [],
        "emails": [],
        "phones": [],
        "other": []
    }
    
    if not text or not text.strip():
        return entities
    
    # ---- Regex-based extraction (always run) ----
    
    # Extract dates
    for pattern in PATTERNS["dates"]:
        matches = re.findall(pattern, text, re.IGNORECASE)
        entities["dates"].extend(matches)
    
    # Extract monetary amounts
    for pattern in PATTERNS["amounts"]:
        matches = re.findall(pattern, text, re.IGNORECASE)
        entities["amounts"].extend(matches)
    
    # Extract emails
    for pattern in PATTERNS["emails"]:
        matches = re.findall(pattern, text)
        entities["emails"].extend(matches)
    
    # Extract phone numbers
    for pattern in PATTERNS["phones"]:
        matches = re.findall(pattern, text)
        entities["phones"].extend(matches)
    
    # Extract IDs/reference numbers
    for pattern in PATTERNS["ids"]:
        matches = re.findall(pattern, text)
        entities["ids"].extend(matches)
    
    # ---- spaCy NER (if available) ----
    if SPACY_AVAILABLE and nlp is not None:
        try:
            # Process text (limit length for performance)
            doc = nlp(text[:10000])
            
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    entities["names"].append(ent.text)
                elif ent.label_ == "ORG":
                    entities["organizations"].append(ent.text)
                elif ent.label_ in ("GPE", "LOC"):
                    entities["locations"].append(ent.text)
                elif ent.label_ == "DATE" and ent.text not in entities["dates"]:
                    entities["dates"].append(ent.text)
                elif ent.label_ == "MONEY" and ent.text not in entities["amounts"]:
                    entities["amounts"].append(ent.text)
                elif ent.label_ in ("CARDINAL", "ORDINAL", "QUANTITY"):
                    pass  # Skip generic numbers
                else:
                    entities["other"].append(f"{ent.label_}: {ent.text}")
        except Exception as e:
            logger.error(f"spaCy NER failed: {e}")
    
    # Deduplicate all lists
    for key in entities:
        entities[key] = list(dict.fromkeys(entities[key]))  # Preserves order
    
    logger.info(f"Extracted entities: {sum(len(v) for v in entities.values())} total items")
    return entities


def generate_summary(text: str, max_sentences: int = 5) -> str:
    """
    Generate a concise summary of the document text.
    Uses extractive summarization (selecting important sentences).
    """
    if not text or not text.strip():
        return "No text content available for summarization."
    
    # Clean the text
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    
    if not sentences:
        # If no proper sentences, return first portion of text
        return text[:500] + ("..." if len(text) > 500 else "")
    
    if len(sentences) <= max_sentences:
        return " ".join(sentences)
    
    # Score sentences based on importance
    scored_sentences = []
    
    # Important keywords that indicate key information
    importance_keywords = [
        "total", "amount", "date", "name", "number", "subject", "reference",
        "purpose", "issued", "valid", "signed", "approved", "important",
        "note", "please", "payment", "due", "invoice", "receipt",
        "application", "applicant", "certificate"
    ]
    
    for i, sentence in enumerate(sentences):
        score = 0
        sentence_lower = sentence.lower()
        
        # Position score (first and last sentences are often important)
        if i == 0:
            score += 3
        elif i == len(sentences) - 1:
            score += 2
        
        # Keyword score
        for keyword in importance_keywords:
            if keyword in sentence_lower:
                score += 1
        
        # Length score (medium-length sentences preferred)
        word_count = len(sentence.split())
        if 10 <= word_count <= 30:
            score += 1
        
        # Contains numbers/dates (often important in documents)
        if re.search(r'\d', sentence):
            score += 1
        
        scored_sentences.append((i, sentence, score))
    
    # Sort by score (descending), then by position to maintain order
    scored_sentences.sort(key=lambda x: (-x[2], x[0]))
    
    # Select top sentences and re-order by position
    top_sentences = sorted(scored_sentences[:max_sentences], key=lambda x: x[0])
    
    summary = " ".join([s[1] for s in top_sentences])
    
    logger.info(f"Generated summary: {len(summary)} chars from {len(sentences)} sentences")
    return summary


def extract_key_fields(text: str, category: str) -> Dict[str, str]:
    """
    Extract key fields based on document category.
    Returns a dictionary of field names and their extracted values.
    """
    fields = {}
    
    if not text or not text.strip():
        return fields
    
    text_lower = text.lower()
    
    # Common fields for all document types
    common_patterns = {
        "Date": r'(?:date|dated?)[:\s]+([^\n,;]+)',
        "Reference Number": r'(?:ref|reference|ref no|ref\.)[:\s#]+([^\n,;]+)',
        "Subject": r'(?:subject|sub|re)[:\s]+([^\n]+)',
    }
    
    # Category-specific patterns
    category_patterns = {
        "Invoice": {
            "Invoice Number": r'(?:invoice|inv|bill)\s*(?:no|number|#)?[:\s]+([A-Z0-9-]+)',
            "Total Amount": r'(?:total|grand total|amount due|net amount)[:\s]+([^\n,;]+)',
            "Due Date": r'(?:due date|payment due|pay by)[:\s]+([^\n,;]+)',
            "Vendor/From": r'(?:from|vendor|seller|supplier)[:\s]+([^\n,;]+)',
            "Bill To": r'(?:bill to|to|buyer|customer)[:\s]+([^\n,;]+)',
        },
        "Form/Application": {
            "Applicant Name": r'(?:name|applicant|candidate)[:\s]+([^\n,;]+)',
            "Date of Birth": r'(?:dob|date of birth|d\.o\.b)[:\s]+([^\n,;]+)',
            "Address": r'(?:address|residential address)[:\s]+([^\n,;]+)',
            "Contact": r'(?:phone|mobile|contact|tel)[:\s]+([^\n,;]+)',
        },
        "Identity Document": {
            "Name": r'(?:name)[:\s]+([^\n,;]+)',
            "ID Number": r'(?:id|number|no\.?)[:\s]+([A-Z0-9\s-]+)',
            "Date of Birth": r'(?:dob|date of birth|d\.o\.b)[:\s]+([^\n,;]+)',
            "Valid Till": r'(?:valid|expiry|expires)[:\s]+([^\n,;]+)',
        },
        "Report": {
            "Title": r'^([^\n]+)',
            "Author": r'(?:by|author|prepared by|written by)[:\s]+([^\n,;]+)',
            "Date": r'(?:date|dated)[:\s]+([^\n,;]+)',
        },
        "Letter": {
            "To": r'(?:dear|to)[:\s]+([^\n,;]+)',
            "From": r'(?:from|sender)[:\s]+([^\n,;]+)',
            "Subject": r'(?:subject|sub|re)[:\s]+([^\n]+)',
        },
        "Contract": {
            "Parties": r'(?:between|party|parties)[:\s]+([^\n]+)',
            "Effective Date": r'(?:effective date|commencement|start date)[:\s]+([^\n,;]+)',
            "Term": r'(?:term|duration|period)[:\s]+([^\n,;]+)',
        },
        "Receipt": {
            "Transaction ID": r'(?:transaction|txn|order)\s*(?:id|no|number)?[:\s#]+([A-Z0-9-]+)',
            "Amount Paid": r'(?:amount|total|paid)[:\s]+([^\n,;]+)',
            "Payment Method": r'(?:payment method|paid by|mode)[:\s]+([^\n,;]+)',
        },
        "Medical Document": {
            "Patient Name": r'(?:patient|name)[:\s]+([^\n,;]+)',
            "Doctor": r'(?:doctor|dr\.?|physician)[:\s]+([^\n,;]+)',
            "Diagnosis": r'(?:diagnosis|condition|finding)[:\s]+([^\n,;]+)',
        }
    }
    
    # Extract common fields
    for field_name, pattern in common_patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            value = match.group(1).strip()
            if value and len(value) < 200:
                fields[field_name] = value
    
    # Extract category-specific fields
    if category in category_patterns:
        for field_name, pattern in category_patterns[category].items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = match.group(1).strip()
                if value and len(value) < 200:
                    fields[field_name] = value
    
    logger.info(f"Extracted {len(fields)} key fields for category: {category}")
    return fields
