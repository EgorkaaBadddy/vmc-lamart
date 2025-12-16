export const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.detail || "Не удалось выполнить запрос");
  }

  return payload;
};
