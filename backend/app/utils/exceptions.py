from fastapi import HTTPException, status
import logging

class CustomHTTPException(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)

class FileValidationException(CustomHTTPException):
    def __init__(self, detail: str):
        super().__init__(detail=detail, status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)

class ProcessingException(CustomHTTPException):
    def __init__(self, detail: str):
        super().__init__(detail=detail, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DocumentNotFoundException(CustomHTTPException):
    def __init__(self, doc_id: str):
        super().__init__(detail=f"Document with ID {doc_id} not found.", status_code=status.HTTP_404_NOT_FOUND)

def global_exception_handler(request, exc):
    logging.error(f"Global Exception caught: {exc}")
    # Handled within FastAPI main.py using ReSponse builder
