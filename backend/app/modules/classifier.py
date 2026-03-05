"""
FormSense AI - Document Classification Module
Classifies documents into categories using ML/keyword-based approaches
Categories: Invoice, Form/Application, Identity Document, Report, Letter, Contract, Receipt, Other
"""

import re
import logging
from typing import Dict, Tuple
from collections import Counter

logger = logging.getLogger(__name__)

# Document category definitions with associated keywords
DOCUMENT_CATEGORIES = {
    "Invoice": {
        "keywords": [
            "invoice", "bill", "billing", "amount due", "total amount", "subtotal",
            "tax", "gst", "payment", "due date", "invoice number", "inv no",
            "unit price", "quantity", "item", "description", "vendor", "supplier",
            "purchase order", "po number", "balance due", "net amount", "gross amount",
            "remit to", "ship to", "bill to", "hsn", "igst", "cgst", "sgst"
        ],
        "weight": 1.0
    },
    "Form/Application": {
        "keywords": [
            "application", "form", "apply", "applicant", "fill", "signature",
            "date of birth", "dob", "father's name", "mother's name", "address",
            "phone number", "mobile", "email", "gender", "male", "female",
            "qualification", "education", "occupation", "declaration", "undertaking",
            "please tick", "please fill", "registration", "enrollment", "admission",
            "checkboxes", "fields", "mandatory", "required"
        ],
        "weight": 1.0
    },
    "Identity Document": {
        "keywords": [
            "aadhaar", "aadhar", "pan card", "passport", "voter id", "driving license",
            "identity", "id card", "unique identification", "uid", "government of india",
            "date of birth", "photograph", "biometric", "id number", "identity number",
            "national id", "citizen", "nationality", "issued by", "valid till",
            "social security", "ssn", "employee id"
        ],
        "weight": 1.2  # Slightly higher weight as IDs have very specific markers
    },
    "Report": {
        "keywords": [
            "report", "analysis", "findings", "conclusion", "recommendation",
            "executive summary", "abstract", "introduction", "methodology",
            "results", "discussion", "table of contents", "appendix",
            "figure", "chart", "graph", "data analysis", "statistics",
            "quarterly", "annual", "monthly", "performance", "assessment",
            "audit", "review", "evaluation"
        ],
        "weight": 0.9
    },
    "Letter": {
        "keywords": [
            "dear sir", "dear madam", "dear mr", "dear ms", "to whom it may concern",
            "sincerely", "regards", "yours faithfully", "yours truly",
            "subject", "ref", "reference", "re:", "with reference to",
            "kindly", "request", "please find", "attached", "enclosed",
            "we are pleased", "thank you", "yours sincerely"
        ],
        "weight": 0.85
    },
    "Contract": {
        "keywords": [
            "contract", "agreement", "terms and conditions", "party", "parties",
            "whereas", "hereby", "herein", "hereinafter", "clause", "section",
            "effective date", "termination", "breach", "confidential",
            "indemnity", "liability", "warranty", "obligation", "binding",
            "witness", "executed", "jurisdiction", "governing law",
            "arbitration", "dispute", "force majeure"
        ],
        "weight": 1.1
    },
    "Receipt": {
        "keywords": [
            "receipt", "received", "payment received", "transaction",
            "transaction id", "cash", "card", "upi", "neft", "rtgs",
            "amount paid", "thank you for", "order id", "booking",
            "confirmation", "ticket", "token", "paid", "change",
            "total", "discount", "vat"
        ],
        "weight": 0.95
    },
    "Medical Document": {
        "keywords": [
            "patient", "diagnosis", "prescription", "medication", "dosage",
            "hospital", "clinic", "doctor", "dr.", "physician", "treatment",
            "medical", "health", "lab report", "blood test", "x-ray",
            "symptoms", "prognosis", "history", "allergies"
        ],
        "weight": 1.0
    }
}


def classify_document(text: str) -> Tuple[str, float, Dict[str, float]]:
    """
    Classify a document based on its extracted text content.
    Uses keyword matching with weighted scoring.
    
    Args:
        text: Extracted text from the document
        
    Returns:
        Tuple of (category, confidence, all_category_scores)
    """
    if not text or not text.strip():
        return ("Other", 0.0, {"Other": 0.0})
    
    text_lower = text.lower()
    words = set(re.findall(r'\b\w+\b', text_lower))
    
    category_scores = {}
    
    for category, config in DOCUMENT_CATEGORIES.items():
        score = 0
        matched_keywords = 0
        total_keywords = len(config["keywords"])
        
        for keyword in config["keywords"]:
            keyword_lower = keyword.lower()
            # Check for multi-word keywords as phrases
            if " " in keyword_lower:
                if keyword_lower in text_lower:
                    score += 2  # Higher score for phrase matches
                    matched_keywords += 1
            else:
                if keyword_lower in words:
                    score += 1
                    matched_keywords += 1
        
        # Apply category weight
        weighted_score = score * config["weight"]
        
        # Calculate confidence as percentage of matched keywords
        if total_keywords > 0:
            confidence = min((matched_keywords / total_keywords) * 2, 1.0)  # Scale up, max 1.0
        else:
            confidence = 0.0
        
        category_scores[category] = round(confidence * config["weight"], 4)
    
    # Find the best category
    if category_scores:
        best_category = max(category_scores, key=category_scores.get)
        best_score = category_scores[best_category]
        
        if best_score > 0.05:  # Minimum threshold
            logger.info(f"Document classified as: {best_category} (confidence: {best_score:.4f})")
            return (best_category, round(best_score, 4), category_scores)
    
    return ("Other", 0.0, category_scores)


def get_category_description(category: str) -> str:
    """Get a human-readable description for a document category"""
    descriptions = {
        "Invoice": "A commercial document issued by a seller to a buyer, relating to a sale transaction.",
        "Form/Application": "A structured document with fields to be filled in by the applicant or user.",
        "Identity Document": "An official document that verifies the identity of an individual.",
        "Report": "A detailed document presenting analysis, findings, or information on a specific topic.",
        "Letter": "A written message or correspondence addressed to a person or organization.",
        "Contract": "A legally binding agreement between two or more parties.",
        "Receipt": "A document acknowledging payment or transaction completion.",
        "Medical Document": "A healthcare-related document such as prescriptions, lab reports, or medical records.",
        "Other": "Document type could not be determined with sufficient confidence."
    }
    return descriptions.get(category, "Unknown document type")
