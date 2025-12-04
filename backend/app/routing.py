import json
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .schemas import (
    ContainerOwner,
    ContainerType,
    Leg,
    OptionItem,
    RouteOption,
    SearchRequest,
)


def _normalize(value: str) -> str:
    return value.strip().lower()


@dataclass
class ContainerMeta:
    size_key: str
    weight_key: str


CONTAINER_MAP: Dict[ContainerType, ContainerMeta] = {
    ContainerType.FT20_LT_24: ContainerMeta(size_key="20ft", weight_key="<24t"),
    ContainerType.FT20_GT_24: ContainerMeta(size_key="20ft", weight_key=">24t"),
    ContainerType.FT40_LT_28: ContainerMeta(size_key="40ft", weight_key="<28t"),
    ContainerType.FT40_GT_28: ContainerMeta(size_key="40ft", weight_key=">28t"),
}


class RouteEngine:
    def __init__(
        self, sea_path: Path, rail_path: Path, rate_date: Optional[date] = None
    ):
        self.sea_path = sea_path
        self.rail_path = rail_path
        self.sea_data = self._load_json(sea_path)
        self.rail_data = self._load_json(rail_path)
        self.custom_today = rate_date
        self.rail_by_departure = self._index_rail()

    @staticmethod
    def _load_json(path: Path) -> List[Dict[str, Any]]:
        with path.open(encoding="utf-8") as f:
            return json.load(f)

    def _index_rail(self) -> Dict[str, List[Dict[str, Any]]]:
        index: Dict[str, List[Dict[str, Any]]] = {}
        for route in self.rail_data:
            key = _normalize(route["departure_station"])
            index.setdefault(key, []).append(route)
        return index

    def _today(self) -> date:
        return self.custom_today or date.today()

    def reload(self) -> None:
        self.sea_data = self._load_json(self.sea_path)
        self.rail_data = self._load_json(self.rail_path)
        self.rail_by_departure = self._index_rail()

    def departure_options(self) -> List[OptionItem]:
        seen = set()
        options: List[OptionItem] = []
        for route in self.sea_data:
            key = _normalize(route["departure_port"])
            if key in seen:
                continue
            seen.add(key)
            options.append(
                OptionItem(
                    name=route["departure_port"],
                    country=route.get("departure_county", ""),
                    kind="sea_departure",
                )
            )
        options.sort(key=lambda x: _normalize(x.name))
        return options

    def destination_options(self) -> List[OptionItem]:
        seen = set()
        options: List[OptionItem] = []
        for route in self.sea_data:
            key = _normalize(route["destination_port"])
            if key not in seen:
                seen.add(key)
                options.append(
                    OptionItem(
                        name=route["destination_port"],
                        country=route.get("destination_county", ""),
                        kind="sea_destination",
                    )
                )
        for route in self.rail_data:
            key = _normalize(route["destination_station"])
            if key in seen:
                continue
            seen.add(key)
            options.append(
                OptionItem(
                    name=route["destination_station"],
                    country=route.get("destination_country", "Россия"),
                    kind="rail_destination",
                )
            )
        options.sort(key=lambda x: _normalize(x.name))
        return options

    @staticmethod
    def _rate_is_valid(rate_value: str, today: date) -> bool:
        try:
            valid_until = datetime.strptime(rate_value, "%Y-%m-%d").date()
            return valid_until >= today
        except (TypeError, ValueError):
            return False

    def _matching_sea_routes(self, departure: str, today: date) -> List[Dict[str, Any]]:
        dep_key = _normalize(departure)
        routes: List[Dict[str, Any]] = []
        for route in self.sea_data:
            if _normalize(route["departure_port"]) != dep_key:
                continue
            if not self._rate_is_valid(route.get("ktk", {}).get("rate_validity"), today):
                continue
            routes.append(route)
        return routes

    def _matching_rail_routes(
        self, via_port: str, destination: str
    ) -> List[Dict[str, Any]]:
        via_key = _normalize(via_port)
        dest_key = _normalize(destination)
        return [
            route
            for route in self.rail_data
            if _normalize(route["departure_station"]) == via_key
            and _normalize(route["destination_station"]) == dest_key
        ]

    def _rail_paths(
        self, start: str, destination: str, max_legs: int = 3
    ) -> List[List[Dict[str, Any]]]:
        """DFS по железнодорожным плечам до max_legs (ребра), без повторов станций."""
        start_key = _normalize(start)
        dest_key = _normalize(destination)
        results: List[List[Dict[str, Any]]] = []

        def dfs(current_key: str, path: List[Dict[str, Any]], visited: set) -> None:
            if len(path) >= max_legs:
                return
            for route in self.rail_by_departure.get(current_key, []):
                next_key = _normalize(route["destination_station"])
                if next_key in visited:
                    continue
                new_path = path + [route]
                if next_key == dest_key:
                    results.append(new_path)
                else:
                    dfs(next_key, new_path, visited | {next_key})

        dfs(start_key, [], {start_key})
        return results

    @staticmethod
    def _pick_rail_cost(
        rail_entry: Dict[str, Any], meta: ContainerMeta
    ) -> Tuple[Optional[float], Optional[str]]:
        costs: Dict[str, Any] = rail_entry.get("transport_cost", {}).get(
            meta.size_key, {}
        )
        if not costs:
            return None, None

        if meta.weight_key in costs:
            return costs[meta.weight_key], meta.weight_key

        # Fallback: choose the heaviest (most expensive) available bracket to avoid underestimation.
        chosen_key = max(costs.keys(), key=lambda key: costs[key])
        return costs[chosen_key], chosen_key

    def _build_route_option(
        self,
        sea_entry: Dict[str, Any],
        rail_entries: Optional[List[Dict[str, Any]]],
        request: SearchRequest,
        meta: ContainerMeta,
    ) -> Optional[RouteOption]:
        sea_costs = sea_entry.get(
            request.owner.value.lower(), {}
        )  # coc or soc dictionaries
        if meta.size_key not in sea_costs:
            return None

        ktk_block = sea_entry.get("ktk", {})
        ktk_cost = ktk_block.get(meta.size_key, 0) if request.owner == ContainerOwner.SOC else 0
        conversion_percent = sea_entry.get("conversion", 0)

        sea_base = sea_costs[meta.size_key] + ktk_cost
        sea_cost = sea_base * (1 + conversion_percent / 100)

        rail_cost_total = 0.0
        security_cost_total = 0.0
        vat_percent = 0.0
        legs: List[Leg] = []

        legs.append(
            Leg(
                mode="sea",
                from_location=f'{sea_entry["departure_port"]}, {sea_entry.get("departure_county", "")}'.strip(
                    ", "
                ),
                to_location=f'{sea_entry["destination_port"]}, {sea_entry.get("destination_county", "")}'.strip(
                    ", "
                ),
                contractor=sea_entry.get("contractor", "Sea contractor"),
                cost=round(sea_cost, 2),
                details=f"conversion {conversion_percent}%",
            )
        )

        if rail_entries:
            for rail_entry in rail_entries:
                security_cost = rail_entry.get("security", {}).get(meta.size_key, 0)
                vat_percent = float(rail_entry.get("vat", 0))
                rail_raw_cost, chosen_weight_key = self._pick_rail_cost(
                    rail_entry, meta
                )
                if rail_raw_cost is None:
                    return None
                rail_cost = rail_raw_cost * (1 + vat_percent / 100)
                rail_cost_total += rail_cost
                security_cost_total += security_cost
                legs.append(
                    Leg(
                        mode="rail",
                        from_location=rail_entry["departure_station"],
                        to_location=rail_entry["destination_station"],
                        contractor=rail_entry.get("contractor", "Rail contractor"),
                        cost=round(rail_cost + security_cost, 2),
                        details=f"weight {chosen_weight_key}, vat {vat_percent}%",
                    )
                )

        tariff_cost = sea_cost + rail_cost_total + security_cost_total
        additional_services_cost = 0.0
        total_cost = tariff_cost + additional_services_cost

        notices: List[str] = []
        if request.owner == ContainerOwner.SOC and ktk_block.get("ktk_over_norm_cost"):
            notices.append(
                f"Для SOC при долгой доставке может взиматься KTK сверх нормы: {ktk_block['ktk_over_norm_cost']} $"
            )

        return RouteOption(
            total_cost=round(total_cost, 2),
            tariff_cost=round(tariff_cost, 2),
            additional_services_cost=round(additional_services_cost, 2),
            currency="USD",
            container_size=meta.size_key,
            container_type=request.container_type,
            owner=request.owner,
            validity=ktk_block.get("rate_validity"),
            conversion_percent=conversion_percent,
            vat_percent=vat_percent,
            sea_cost=round(sea_cost, 2),
            rail_cost=round(rail_cost_total, 2),
            security_cost=round(security_cost_total, 2),
            legs=legs,
            notices=notices,
        )

    def find_routes(self, request: SearchRequest) -> List[RouteOption]:
        today = self._today()
        meta = CONTAINER_MAP[request.container_type]
        sea_routes = self._matching_sea_routes(request.departure, today)
        results: List[RouteOption] = []
        seen_signatures = set()

        destination_key = _normalize(request.destination)

        for sea_route in sea_routes:
            sea_destination_key = _normalize(sea_route["destination_port"])
            # Direct sea route
            if sea_destination_key == destination_key:
                option = self._build_route_option(sea_route, None, request, meta)
                if option:
                    results.append(option)

            # Sea + rail route(s) with up to 3 rail legs
            rail_paths = self._rail_paths(
                sea_route["destination_port"], request.destination, max_legs=3
            )
            for rail_path in rail_paths:
                option = self._build_route_option(sea_route, rail_path, request, meta)
                if option:
                    signature = tuple(
                        (leg.mode, _normalize(leg.from_location), _normalize(leg.to_location))
                        for leg in option.legs
                    )
                    if signature in seen_signatures:
                        continue
                    seen_signatures.add(signature)
                    results.append(option)

        results.sort(key=lambda item: item.total_cost)
        return results[:5]

    def current_date(self) -> date:
        return self._today()
