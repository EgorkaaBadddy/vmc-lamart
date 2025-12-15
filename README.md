# vmc-lamart

## Подготовка окружения
1. Установите Poetry (например, `pip install --user poetry`).
2. В проекте включён локальный venv (`[virtualenvs] in-project = true`), после `poetry install` появится папка `.venv/` рядом с `pyproject.toml`.
3. Установка зависимостей (используем Poetry как менеджер зависимостей, `package-mode = false`):
   - `poetry install`

## Запуск backend
- Без активации окружения:
  - `poetry run uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload`
- Или с активацией `.venv`:
  - Windows: `.\.venv\Scripts\activate`
  - Linux/macOS: `source .venv/bin/activate`
  - Затем: `uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload`

## Полезное
- Документация API: http://127.0.0.1:8000/docs
- Корневая страница фронтенда: http://127.0.0.1:8000/
- Данные для тарифов: `dd/sea.json`, `dd/rjd.json`, `dd/extra_services.json`
- Фиксированная дата тарифов (опционально):
  - Windows: `set APP_ROUTE_RATE_DATE=2024-12-15`
  - Linux/macOS: `APP_ROUTE_RATE_DATE=2024-12-15 poetry run uvicorn app.main:app --app-dir backend --reload`
