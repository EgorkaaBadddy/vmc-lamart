export const RadioRow = ({ label, name, options, value, onChange, disabled }) => (
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
