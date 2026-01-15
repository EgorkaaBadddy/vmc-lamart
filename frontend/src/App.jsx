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
    departure: "",
    destination: "",
    containerType: "",
    owner: "",
  };

  const {
    form,
    routes,
    rateDate,
    status,
    searching,
    serviceSelections,
    isSorted,
    handleFormChange,
    submitSearch,
    sortByPrice,
    toggleService,
  } = useSearch(initialForm);

  // Обновление формы при загрузке справочников
  useEffect(() => {
    if (loadingOptions) {
      return;
    }

    if (!form.departure && departures.length > 0) {
      handleFormChange("departure", departures[0].name);
    }
    if (!form.destination && destinations.length > 0) {
      handleFormChange("destination", destinations[0].name);
    }
    if (!form.containerType && containerTypes.length > 0) {
      handleFormChange("containerType", containerTypes[0].value);
    }
    if (!form.owner && owners.length > 0) {
      handleFormChange("owner", owners[0].value);
    }
  }, [
    loadingOptions,
    departures,
    destinations,
    containerTypes,
    owners,
    form.departure,
    form.destination,
    form.containerType,
    form.owner,
    handleFormChange,
  ]);

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
            isSorted={isSorted}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
