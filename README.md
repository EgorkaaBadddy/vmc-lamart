# vmc-lamart

Калькулятор импортных маршрутов на FastAPI + React.

## Backend (FastAPI)
- Требования: Python 3.11+, Poetry.
- Установка зависимостей: `poetry install` (в каталоге проекта).
- Запуск в дев-режиме: `poetry run uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload`.
- Переменная для фиксации даты тарифов: `APP_ROUTE_RATE_DATE=YYYY-MM-DD`.
- API документация: http://127.0.0.1:8000/docs
- Файлы тарифов и доп.услуг: `dd/sea.json`, `dd/rjd.json`, `dd/extra_services.json`.

## Frontend (React)
- Требования: Node.js 18+ и npm.
- Установка зависимостей: `cd frontend && npm install`.
- Дев-сервер: `npm run dev` (отдаёт фронтенд на http://127.0.0.1:5173).
- Сборка для бекенда: `npm run build` (выкладывается в `frontend/dist`).

## Запуск как единого приложения
1. Соберите фронтенд: `cd frontend && npm install && npm run build`.
2. Запустите бекенд: `poetry run uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000`.
3. Откройте http://127.0.0.1:8000 — фронтенд собирается из `frontend/dist` и ходит в API по `/api`.
