import { useState, useCallback  } from "react";
import { fetchJson } from "../api/client";
import { API_BASE } from "../utils/constants";

export const useSearch = (initialForm) => {
  const [form, setForm] = useState(initialForm);
  const [routes, setRoutes] = useState([]);
  const [rateDate, setRateDate] = useState("");
  const [status, setStatus] = useState({
    text: "Готов к работе",
    tone: "muted",
  });
  const [searching, setSearching] = useState(false);
  const [serviceSelections, setServiceSelections] = useState({});

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
      setStatus({
        text: error.message || "Не удалось выполнить поиск",
        tone: "danger",
      });
    } finally {
      setSearching(false);
    }
  };

  const [isSorted, setIsSorted] = useState(false);

  const sortByPrice = useCallback(() => {
    setIsSorted(prev => !prev);  // Используйте prev вместо isSorted (избегает deps loop)
  }, []);

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

  return {
    form,
    routes,
    rateDate,
    status,
    searching,
    serviceSelections,
    handleFormChange,
    submitSearch,
    sortByPrice,
    isSorted,
    toggleService,
  };
};
