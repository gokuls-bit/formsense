from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "FormSense AI – Document Intelligence"
    API_VERSION: str = "v1"
    
    # DB
    DATABASE_URL: str = "sqlite+aiosqlite:///./formsense.db"
    
    # Storage
    UPLOAD_DIR: str = "../uploads"
    MAX_FILE_SIZE_MB: int = 15
    ALLOWED_MIME_TYPES: list[str] = ["application/pdf", "image/jpeg", "image/png", "image/tiff"]
    
    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
