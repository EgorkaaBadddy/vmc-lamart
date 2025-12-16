import { useEffect, useState } from "react";
import { fetchJson } from "../api/client";
import { API_BASE, ownerLabels } from "../utils/constants";

export const useOptions = () => {
  const [departures, setDepartures] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [containerTypes, setContainerTypes] = useState([]);
  const [owners, setOwners] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({
    text: "Готов к работе",
    tone: "muted",
  });

  useEffect(() => {
    const loadOptions = async () => {
      setStatus({ text: "Загружаем справочники...", tone: "muted" });
      setLoading(true);

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

        setStatus({ text: "Справочники загружены", tone: "success" });
      } catch (error) {
        console.error(error);
        setStatus({
          text: error.message || "Ошибка загрузки справочников",
          tone: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  return {
    departures,
    destinations,
    containerTypes,
    owners,
    services,
    loading,
    status,
  };
};
