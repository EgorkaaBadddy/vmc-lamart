import { SelectField } from "./SelectField";
import { RadioRow } from "./RadioRow";
import { formatContainer } from "../utils/formatters";

export const FormCard = ({
  form,
  departures,
  destinations,
  containerTypes,
  owners,
  loading,
  searching,
  status,
  onFormChange,
  onSubmit,
}) => {
  return (
    <section className="panel form-card">
      <h2>Контейнерная перевозка</h2>
      <form className="form" onSubmit={onSubmit}>
        <SelectField
          label="Пункт отправления"
          name="departure"
          value={form.departure}
          disabled={loading}
          options={departures.map((item) => ({
            value: item.name,
            label: `${item.name}${item.country ? `, ${item.country}` : ""}`,
          }))}
          onChange={onFormChange}
        />

        <SelectField
          label="Пункт назначения"
          name="destination"
          value={form.destination}
          disabled={loading}
          options={destinations.map((item) => ({
            value: item.name,
            label: `${item.name}${item.country ? `, ${item.country}` : ""}${
              item.kind === "rail_destination" ? " · Ж/д" : " · Море"
            }`,
          }))}
          onChange={onFormChange}
        />

        <SelectField
          label="Тип контейнера"
          name="containerType"
          value={form.containerType}
          disabled={loading}
          options={containerTypes.map((item) => ({
            value: item.value,
            label: formatContainer(item.value),
          }))}
          onChange={onFormChange}
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
          disabled={loading}
          onChange={onFormChange}
        />

        <div className="actions">
          <button type="submit" className="btn primary" disabled={searching || loading}>
            {searching ? "Ищем..." : "Найти маршруты"}
          </button>
        </div>

        <div className={`status-line ${status.tone}`}>{status.text}</div>
      </form>
    </section>
  );
};
