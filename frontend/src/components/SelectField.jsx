export const SelectField = ({ label, name, value, options, onChange, disabled }) => (
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
