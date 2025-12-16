import { useMemo } from "react";
import { money } from "../utils/formatters";
import { routeKey, calculateServiceExtra } from "../utils/helpers";
import { RouteCard } from "./RouteCard";

export const Results = ({
  routes,
  services,
  serviceSelections,
  onToggleService,
  onSort,
  rateDate,
  status,
}) => {
  const withTotals = useMemo(
    () =>
      routes.map((route) => {
        const key = routeKey(route);
        const selected = serviceSelections[key] || [];
        const extra = calculateServiceExtra(services, selected);
        return { route, total: route.total_cost + extra, selected };
      }),
    [routes, serviceSelections, services]
  );

  return (
    <section className="panel results-card">
      <div className="results-head">
        <div>
          <h2>Результаты</h2>
          {rateDate && <div className="muted">Актуально на {rateDate}</div>}
        </div>
        <div className="sort-buttons">
          <button
            className="btn ghost"
            onClick={onSort}
            disabled={!routes.length}
          >
            Сортировать по цене
          </button>
        </div>
      </div>

      {!routes.length ? (
        <div className="empty-state">
          <p>Нет актуальных ставок для выбранных параметров.</p>
          {status?.text && <p className="muted">{status.text}</p>}
        </div>
      ) : (
        <div className="results">
          {withTotals.map(({ route, total, selected }) => (
            <RouteCard
              key={routeKey(route)}
              route={route}
              services={services}
              selectedServices={selected}
              totalWithExtras={total}
              onToggleService={onToggleService}
            />
          ))}
        </div>
      )}
    </section>
  );
};
