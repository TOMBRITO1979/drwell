from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path


def get_secret(secret_name: str, default: str = "") -> str:
    """
    Get secret from file (Docker Swarm) or environment variable.

    Priority:
    1. /run/secrets/{secret_name} (Docker Swarm secret)
    2. Environment variable {secret_name}_FILE (path to file)
    3. Environment variable {secret_name}
    4. Default value
    """
    # Try Docker Swarm secret file
    secret_file = Path(f"/run/secrets/{secret_name}")
    if secret_file.exists():
        return secret_file.read_text().strip()

    # Try environment variable pointing to file
    env_file = os.getenv(f"{secret_name}_FILE")
    if env_file:
        file_path = Path(env_file)
        if file_path.exists():
            return file_path.read_text().strip()

    # Try direct environment variable
    env_value = os.getenv(secret_name)
    if env_value:
        return env_value

    # Return default
    return default


class Settings(BaseSettings):
    # Project Info
    PROJECT_NAME: str = "DrWell - CRM para Advogados"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"

    # Security
    SECRET_KEY: str = get_secret("secret_key", "your-secret-key-change-in-production-please")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://drwell:drwell_secret@localhost:5432/drwell_db"
    )

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://:redis_secret@localhost:6379/0")

    # CORS
    BACKEND_CORS_ORIGINS: list = ["*"]  # Configure properly in production

    # DataJud API
    DATAJUD_API_KEY: str = os.getenv(
        "DATAJUD_API_KEY",
        "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=="
    )
    DATAJUD_BASE_URL: str = "https://api-publica.datajud.cnj.jus.br"

    # Celery
    CELERY_BROKER_URL: str = REDIS_URL
    CELERY_RESULT_BACKEND: str = REDIS_URL

    # Process Update Interval (in minutes)
    PROCESS_UPDATE_INTERVAL: int = 60  # Check every hour

    # Upload Settings
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
