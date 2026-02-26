"""
Centralized configuration loaded from environment variables.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from .env or environment variables."""

    # Supabase
    supabase_url: str
    supabase_service_key: str

    # Analysis
    analysis_interval_seconds: int = 30
    min_events_per_window: int = 3
    feature_window_minutes: int = 2

    # Model
    model_path: str = "models/isolation_forest_v1.joblib"
    rule_weight: float = 0.6
    ml_weight: float = 0.4
    alert_severity_threshold: str = "MEDIUM"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
