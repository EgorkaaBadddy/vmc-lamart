import { money } from "../utils/formatters";

export const ServicesBlock = ({ route, services, selected, onToggle, routeKey }) => {
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
                onChange={() => onToggle(routeKey, index)}
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
