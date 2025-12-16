import { useEffect } from "react";
import { useSearch } from "./hooks/useSearch";
import { useOptions } from "./hooks/useOptions";
import { Sidebar } from "./components/Sidebar";
import { PageHeader } from "./components/PageHeader";
import { FormCard } from "./components/FormCard";
import { Results } from "./components/Results";

function App() {
  // Загрузка справочников
  const {
    departures,
    destinations,
    containerTypes,
    owners,
    services,
    loading: loadingOptions,
    status: optionsStatus,
  } = useOptions();

  // Инициализация формы после загрузки справочников
  const initialForm = {
    departure: departures?.name || "",
    destination: destinations?.name || "",
    containerType: containerTypes?.value || "",
    owner: owners?.value || "COC",
  };

  const {
    form,
    routes,
    rateDate,
    status,
    searching,
    serviceSelections,
    handleFormChange,
    submitSearch,
    sortByPrice,
    toggleService,
  } = useSearch(initialForm);

  // Обновляем форму при загрузке справочников
  useEffect(() => {
    if (!loadingOptions && form.departure === "") {
      handleFormChange("departure", departures?.name || "");
    }
  }, [loadingOptions, departures]);

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="page">
        <PageHeader status={optionsStatus} />

        <div className="columns">
          <FormCard
            form={form}
            departures={departures}
            destinations={destinations}
            containerTypes={containerTypes}
            owners={owners}
            loading={loadingOptions}
            searching={searching}
            status={status}
            onFormChange={handleFormChange}
            onSubmit={submitSearch}
          />

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
