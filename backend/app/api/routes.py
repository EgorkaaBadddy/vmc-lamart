import json
from typing import Dict, List

from fastapi import APIRouter, HTTPException

from ..core.config import get_settings
from ..routing import RouteEngine
from ..schemas import (
    ContainerOwner,
    ContainerType,
    ExtraService,
    OptionItem,
    SearchRequest,
    SearchResponse,
)

settings = get_settings()
engine = RouteEngine(settings.sea_path, settings.rail_path, settings.route_rate_date)

router = APIRouter(prefix="/api", tags=["routes"])


@router.get("/options/departure", response_model=List[OptionItem])
def get_departures() -> List[OptionItem]:
    return engine.departure_options()


@router.get("/options/destination", response_model=List[OptionItem])
def get_destinations() -> List[OptionItem]:
    return engine.destination_options()


@router.get("/meta")
def get_meta() -> Dict[str, List[Dict[str, str]]]:
    container_types = [
        {"value": ctype.value, "label": ctype.value.replace("_", " ")}
        for ctype in ContainerType
    ]
    owners = [
        {"value": ContainerOwner.COC.value, "label": "COC (все включено)"},
        {"value": ContainerOwner.SOC.value, "label": "SOC (контейнер клиента)"},
    ]
    return {"container_types": container_types, "owners": owners}


@router.post("/search", response_model=SearchResponse)
def search_routes(request: SearchRequest) -> SearchResponse:
    routes = engine.find_routes(request)
    if not routes:
        raise HTTPException(status_code=404, detail="Маршруты не найдены")
    return SearchResponse(routes=routes, rate_date=str(engine.current_date()))


@router.get("/services", response_model=List[ExtraService])
def get_extra_services() -> List[ExtraService]:
    with settings.extra_services_path.open(encoding="utf-8") as f:
        data = json.load(f)
    return [ExtraService(**item) for item in data]
