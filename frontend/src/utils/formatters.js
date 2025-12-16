export const money = (value) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);

export const formatContainer = (value) =>
  value
    .replace("ft", " футов ")
    .replace("_", " ")
    .replace("<", "< ")
    .replace(">", "> ")
    .trim();
