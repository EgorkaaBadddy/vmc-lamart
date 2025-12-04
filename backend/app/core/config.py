import os
from dataclasses import dataclass
from datetime import date, datetime
from functools import lru_cache
from pathlib import Path
from typing import Optional


@dataclass
class Settings:
    """Глобальные настройки сервиса без сторонних зависимостей."""

    base_dir: Path = Path(__file__).resolve().parents[3]
    data_dir: Path = base_dir / "dd"
    route_rate_date: Optional[date] = None

    def __post_init__(self) -> None:
        env_date = os.getenv("APP_ROUTE_RATE_DATE")
        if env_date:
            try:
                self.route_rate_date = datetime.strptime(env_date, "%Y-%m-%d").date()
            except ValueError:
                self.route_rate_date = None

    @property
    def sea_path(self) -> Path:
        return self.data_dir / "sea.json"

    @property
    def rail_path(self) -> Path:
        return self.data_dir / "rjd.json"

    @property
    def extra_services_path(self) -> Path:
        return self.data_dir / "extra_services.json"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
