from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class ContainerOwner(str, Enum):
    COC = "COC"
    SOC = "SOC"


class ContainerType(str, Enum):
    FT20_LT_24 = "20ft_<24t"
    FT20_GT_24 = "20ft_>24t"
    FT40_LT_28 = "40ft_<28t"
    FT40_GT_28 = "40ft_>28t"


class SearchRequest(BaseModel):
    departure: str
    destination: str
    container_type: ContainerType
    owner: ContainerOwner


class OptionItem(BaseModel):
    name: str
    country: str
    kind: str  # sea_departure, sea_destination, or rail_destination


class Leg(BaseModel):
    mode: str  # sea | rail
    from_location: str
    to_location: str
    contractor: str
    cost: float
    details: Optional[str] = None


class RouteOption(BaseModel):
    total_cost: float
    tariff_cost: float
    additional_services_cost: float
    currency: str
    container_size: str
    container_type: ContainerType
    owner: ContainerOwner
    validity: Optional[str]
    conversion_percent: float
    vat_percent: float
    sea_cost: float
    rail_cost: float
    security_cost: float
    legs: List[Leg]
    notices: List[str]

    class Config:
        from_attributes = True


class SearchResponse(BaseModel):
    routes: List[RouteOption]
    rate_date: str


class ExtraService(BaseModel):
    name: str
    price: float
