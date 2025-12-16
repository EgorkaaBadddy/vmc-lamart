import { useMemo } from "react";
import { money, formatContainer } from "../utils/formatters";
import { routeKey } from "../utils/helpers";
import { LegRow } from "./LegRow";
import { ServicesBlock } from "./ServicesBlock";

export const RouteCard = ({ route, services, selectedServices, onToggleService, totalWithExtras }) => {
  const selected = useMemo(
    () => new Set(selectedServices || []),
    [selectedServices]
  );

  const key = routeKey(route);

  return (
    <div className="route-card">
      <div className="card-head">
        <div>
          <div className="label">Действует до</div>
          <div className="value">{route.validity || "не указано"}</div>
        </div>
        <div>
          <div className="label">Тип контейнера</div>
          <div className="value">{formatContainer(route.container_type)}</div>
        </div>
        <div>
          <div className="label">Владелец</div>
          <div className="value">{route.owner}</div>
        </div>
        <div>
          <div className="label">Итого</div>
          <div className="value highlight">{money(totalWithExtras)}</div>
        </div>
      </div>

      <div className="leg-list">
        {route.legs.map((leg, idx) => (
          <LegRow
            key={`${leg.from_location}-${leg.to_location}-${idx}`}
            leg={leg}
          />
        ))}
      </div>

      <div className="card-footer">
        <div className="muted">
          Тариф: {money(route.tariff_cost)} · Море: {money(route.sea_cost)} · Ж/д:{" "}
          {money(route.rail_cost)} · Безопасность: {money(route.security_cost)}
        </div>
        {!!route.notices?.length && (
          <div className="notes">{route.notices.join(" · ")}</div>
        )}
      </div>

      <ServicesBlock
        route={route}
        services={services}
        selected={selected}
        onToggle={onToggleService}
        routeKey={key}
      />
    </div>
  );
};
