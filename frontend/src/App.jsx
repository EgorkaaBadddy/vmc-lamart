import { useEffect, useMemo, useState } from "react";

const API_BASE = "/api";

const money = (value) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatContainer = (value) =>
  value
    .replace("ft", " футов ")
    .replace("_", " ")
    .replace("<", "< ")
    .replace(">", "> ")
    .trim();

const ownerLabels = {
  COC: "COC (все включено)",
  SOC: "SOC (контейнер клиента)",
};

const routeKey = (route) =>
  [
    route.owner,
    route.container_type,
    route.container_size,
    route.legs.map((leg) => `${leg.mode}-${leg.from_location}-${leg.to_location}`).join("|"),
  ].join("__");

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.detail || "Не удалось выполнить запрос");
  }

  return payload;
};

const SelectField = ({ label, name, value, options, onChange, disabled }) => (
  <label className="field">
    <span className="field-label">{label}</span>
    <div className="select-shell">
      <select
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.name, event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  </label>
);

const RadioRow = ({ label, name, options, value, onChange, disabled }) => (
  <div className="field">
    <span className="field-label">{label}</span>
    <div className="radio-row">
      {options.map((option) => (
        <label key={option.value} className="radio">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.name, event.target.value)}
          />
          <div>
            <div className="radio-title">{option.label}</div>
            {option.hint && <div className="muted">{option.hint}</div>}
          </div>
        </label>
      ))}
    </div>
  </div>
);

const LegRow = ({ leg }) => (
  <div className={`leg ${leg.mode}`}>
    <div>
      <div className="label">{leg.mode === "sea" ? "Морской участок" : "Ж/д участок"} · {leg.contractor}</div>
      <div className="city-row">
        <span>{leg.from_location}</span>
        <span className="arrow">→</span>
        <span>{leg.to_location}</span>
      </div>
    </div>
    <div className="leg-price">
      <div className="cost">{money(leg.cost)}</div>
      {leg.details && <div className="details">{leg.details}</div>}
    </div>
  </div>
);

const ServicesBlock = ({ route, services, selected, onToggle }) => {
  if (!services.length) return null;

  return (
    <div className="services">
      <div className="services-head">
        <h4>Дополнительные услуги</h4>
        <span className="muted">Отметьте нужные опции, сумма пересчитается.</span>
      </div>
      <div className="services-list">
        {services.map((service, index) => {
          const checked = selected.has(index);
          return (
            <label key={service.name} className={`service-item ${checked ? "checked" : ""}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(routeKey(route), index)}
              />
              <span className="service-name">{service.name}</span>
              <span className="service-price">+{money(service.price)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

const RouteCard = ({ route, services, selectedServices, onToggleService, totalWithExtras }) => {
  const selected = useMemo(() => new Set(selectedServices || []), [selectedServices]);

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
          <LegRow key={`${leg.from_location}-${leg.to_location}-${idx}`} leg={leg} />
        ))}
      </div>

      <div className="card-footer">
        <div className="muted">
          Тариф: {money(route.tariff_cost)} · Море: {money(route.sea_cost)} · Ж/д: {money(route.rail_cost)} ·
          Безопасность: {money(route.security_cost)}
        </div>
        {!!route.notices?.length && <div className="notes">{route.notices.join(" · ")}</div>}
      </div>

      <ServicesBlock
        route={route}
        services={services}
        selected={selected}
        onToggle={onToggleService}
      />
    </div>
  );
};

const Results = ({ routes, services, serviceSelections, onToggleService, onSort, rateDate, status }) => {
  const withTotals = useMemo(
    () =>
      routes.map((route) => {
        const key = routeKey(route);
        const selected = serviceSelections[key] || [];
        const extra = selected.reduce((sum, idx) => sum + (services[idx]?.price || 0), 0);
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
          <button className="btn ghost" onClick={onSort} disabled={!routes.length}>
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

function App() {
  const [departures, setDepartures] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [containerTypes, setContainerTypes] = useState([]);
  const [owners, setOwners] = useState([]);
  const [services, setServices] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [rateDate, setRateDate] = useState("");
  const [status, setStatus] = useState({ text: "Готов к работе", tone: "muted" });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [searching, setSearching] = useState(false);
  const [serviceSelections, setServiceSelections] = useState({});
  const [form, setForm] = useState({
    departure: "",
    destination: "",
    containerType: "",
    owner: "",
  });

  useEffect(() => {
    const loadOptions = async () => {
      setStatus({ text: "Загружаем справочники...", tone: "muted" });
      setLoadingOptions(true);
      try {
        const [deps, dests, meta, extras] = await Promise.all([
          fetchJson(`${API_BASE}/options/departure`),
          fetchJson(`${API_BASE}/options/destination`),
          fetchJson(`${API_BASE}/meta`),
          fetchJson(`${API_BASE}/services`),
        ]);

        setDepartures(deps);
        setDestinations(dests);
        setContainerTypes(meta?.container_types || []);
        setOwners(
          (meta?.owners || []).map((item) => ({
            ...item,
            label: ownerLabels[item.value] || item.label,
          }))
        );
        setServices(extras);

        setForm((prev) => ({
          departure: prev.departure || deps[0]?.name || "",
          destination: prev.destination || dests[0]?.name || "",
          containerType: prev.containerType || meta?.container_types?.[0]?.value || "",
          owner: prev.owner || meta?.owners?.[0]?.value || "COC",
        }));

        setStatus({ text: "Справочники загружены", tone: "success" });
      } catch (error) {
        console.error(error);
        setStatus({ text: error.message, tone: "danger" });
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  const handleFormChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitSearch = async (event) => {
    event.preventDefault();
    if (!form.departure || !form.destination || !form.containerType || !form.owner) {
      setStatus({
        text: "Выберите отправку, назначение, контейнер и владельца",
        tone: "danger",
      });
      return;
    }

    setSearching(true);
    setStatus({ text: "Ищем подходящие маршруты...", tone: "muted" });

    try {
      const payload = {
        departure: form.departure,
        destination: form.destination,
        container_type: form.containerType,
        owner: form.owner,
      };

      const data = await fetchJson(`${API_BASE}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setRoutes(data.routes);
      setRateDate(data.rate_date);
      setServiceSelections({});
      setStatus({
        text: `Найдено вариантов: ${data.routes.length}. Дата тарифа: ${data.rate_date}`,
        tone: "success",
      });
    } catch (error) {
      console.error(error);
      setRoutes([]);
      setRateDate("");
      setStatus({ text: error.message || "Не удалось выполнить поиск", tone: "danger" });
    } finally {
      setSearching(false);
    }
  };

  const sortByPrice = () => {
    setRoutes((prev) => [...prev].sort((a, b) => a.total_cost - b.total_cost));
  };

  const toggleService = (key, index) => {
    setServiceSelections((prev) => {
      const existing = new Set(prev[key] || []);
      if (existing.has(index)) {
        existing.delete(index);
      } else {
        existing.add(index);
      }
      return { ...prev, [key]: Array.from(existing) };
    });
  };

  const statusClass =
    status.tone === "danger" ? "status danger" : status.tone === "success" ? "status success" : "status";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo"></div>
      </aside>

      <main className="page">
        <header className="page-head">
          <div>
            <div className="eyebrow">Сервис расчета импорта</div>
            <h1>Калькулятор менеджера</h1>
          </div>
          <div className={statusClass}>{status.text}</div>
        </header>

        <div className="columns">
          <section className="panel form-card">
            <h2>Контейнерная перевозка</h2>
            <form className="form" onSubmit={submitSearch}>
              <SelectField
                label="Пункт отправления"
                name="departure"
                value={form.departure}
                disabled={loadingOptions}
                options={departures.map((item) => ({
                  value: item.name,
                  label: `${item.name}${item.country ? `, ${item.country}` : ""}`,
                }))}
                onChange={handleFormChange}
              />
              <SelectField
                label="Пункт назначения"
                name="destination"
                value={form.destination}
                disabled={loadingOptions}
                options={destinations.map((item) => ({
                  value: item.name,
                  label: `${item.name}${item.country ? `, ${item.country}` : ""}${
                    item.kind === "rail_destination" ? " · Ж/д" : " · Море"
                  }`,
                }))}
                onChange={handleFormChange}
              />
              <SelectField
                label="Тип контейнера"
                name="containerType"
                value={form.containerType}
                disabled={loadingOptions}
                options={containerTypes.map((item) => ({
                  value: item.value,
                  label: formatContainer(item.value),
                }))}
                onChange={handleFormChange}
              />

              <RadioRow
                label="Container owner"
                name="owner"
                options={owners.map((owner) => ({
                  value: owner.value,
                  label: owner.label || owner.value,
                  hint: owner.hint,
                }))}
                value={form.owner}
                disabled={loadingOptions}
                onChange={handleFormChange}
              />

              <div className="actions">
                <button type="submit" className="btn primary" disabled={searching || loadingOptions}>
                  {searching ? "Ищем..." : "Найти маршруты"}
                </button>
              </div>
              <div className={`status-line ${status.tone}`}>{status.text}</div>
            </form>
          </section>

          <Results
            routes={routes}
            services={services}
            serviceSelections={serviceSelections}
            onToggleService={toggleService}
            onSort={sortByPrice}
            rateDate={rateDate}
            status={status}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
