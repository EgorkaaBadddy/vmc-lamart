# vmc-lamart

Для запуска:

1. Установить виртуальное окружение
   > python3 -m venv .venv
2. Активируем окружение
   > source .venv/bin/activate
3. Устанавливаем зависимости
   > pip install -r backend/requirements.txt
4. Стартуем
   > APP_ROUTE_RATE_DATE=2025-10-01 uvicorn backend.app.main:app --reload
