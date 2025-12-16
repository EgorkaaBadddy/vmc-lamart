import { money } from "../utils/formatters";

export const LegRow = ({ leg }) => (
  <div className={`leg ${leg.mode}`}>
    <div>
      <div className="label">
        {leg.mode === "sea" ? "Морской участок" : "Ж/д участок"} · {leg.contractor}
      </div>
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
