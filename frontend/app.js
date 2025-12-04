const API_BASE = "/api";

const departureSelect = document.querySelector("#departure");
const destinationSelect = document.querySelector("#destination");
const containerSelect = document.querySelector("#containerType");
const statusEl = document.querySelector("#status");
const resultsEl = document.querySelector("#results");
const formEl = document.querySelector("#search-form");
const sortPriceBtn = document.querySelector("#sortPrice");

let extraServices = [];
let lastRoutes = [];

const money = (value) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const humanContainer = (value) => {
  return value
    .replace("ft", " футов")
    .replace("_", " ")
    .replace("<", "< ")
    .replace(">", "> ");
};

const humanKind = (kind) =>
  kind === "rail_destination" ? "Ж/д" : "Порт";

const setStatus = (text, error = false) => {
  statusEl.textContent = text || "";
  statusEl.style.color = error ? "var(--danger)" : "var(--muted)";
};

async function loadOptions() {
  setStatus("Загружаем данные…");
  try {
    const [depsRes, destRes, metaRes, servicesRes] = await Promise.all([
      fetch(`${API_BASE}/options/departure`),
      fetch(`${API_BASE}/options/destination`),
      fetch(`${API_BASE}/meta`),
      fetch(`${API_BASE}/services`),
    ]);

    const [departures, destinations, meta, services] = await Promise.all([
      depsRes.json(),
      destRes.json(),
      metaRes.json(),
      servicesRes.json(),
    ]);
    extraServices = services;

    fillSelect(
      departureSelect,
      departures.map((item) => ({
        value: item.name,
        label: `${item.name}, ${item.country}`,
      })),
      "Выберите порт отправления"
    );

    fillSelect(
      destinationSelect,
      destinations.map((item) => ({
        value: item.name,
        label: `${item.name}, ${item.country} · ${humanKind(item.kind)}`,
      })),
      "Город доставки"
    );

    fillSelect(
      containerSelect,
      meta.container_types.map((type) => ({
        value: type.value,
        label: humanContainer(type.value),
      }))
    );

    if (departures.length && !departureSelect.value) {
      departureSelect.value = departures[0].name;
    }
    if (destinations.length && !destinationSelect.value) {
      destinationSelect.value = destinations[0].name;
    }

    setStatus("Готово к расчету");
  } catch (err) {
    console.error(err);
    setStatus("Не удалось загрузить справочники", true);
  }
}

function fillSelect(select, options, placeholder) {
  select.innerHTML = "";
  if (placeholder) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = placeholder;
    opt.disabled = true;
    opt.selected = true;
    select.appendChild(opt);
  }
  options.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item.value;
    opt.textContent = item.label;
    select.appendChild(opt);
  });
}

async function searchRoutes(event) {
  event.preventDefault();
  const owner = document.querySelector('input[name="owner"]:checked')?.value;
  if (!owner) return;

  const payload = {
    departure: departureSelect.value,
    destination: destinationSelect.value,
    container_type: containerSelect.value,
    owner,
  };

  setStatus("Считаем маршрут…");
  resultsEl.innerHTML = "";

  try {
    const response = await fetch(`${API_BASE}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const detail = await response.json();
      setStatus(detail.detail || "Маршруты не найдены", true);
      resultsEl.innerHTML = `<div class="empty-state">Нет актуальных ставок для выбранных параметров.</div>`;
      lastRoutes = [];
      return;
    }

    const data = await response.json();
    lastRoutes = data.routes;
    renderRoutes(data.routes, data.rate_date);
    setStatus(`Проверка ставок на дату: ${data.rate_date}`);
  } catch (err) {
    console.error(err);
    setStatus("Ошибка при расчете маршрута", true);
  }
}

function renderRoutes(routes, rateDate) {
  if (!routes || !routes.length) {
    resultsEl.innerHTML = `<div class="empty-state">Маршрутов не найдено</div>`;
    return;
  }
  resultsEl.innerHTML = "";
  routes.forEach((route, index) => {
    const card = document.createElement("div");
    card.className = "route-card";
    const baseTotal = route.total_cost;
    card.dataset.baseTotal = baseTotal;
    card.dataset.index = index;

    card.innerHTML = `
      <div class="card-head">
        <div>
          <div class="label">Ставка валидна до</div>
          <div class="value">${route.validity || "—"}</div>
        </div>
        <div>
          <div class="label">Контейнер</div>
          <div class="value">${humanContainer(route.container_type)}</div>
        </div>
        <div>
          <div class="label">Владелец</div>
          <div class="value">${route.owner}</div>
        </div>
        <div>
          <div class="label">Итого</div>
          <div class="value highlight total-display">${money(baseTotal)}</div>
        </div>
      </div>
      <div class="leg-list">
        ${route.legs
          .map(
            (leg) => `
          <div class="leg ${leg.mode}">
            <div>
              <div class="label">${leg.mode === "sea" ? "Море" : "Ж/д"} · ${leg.contractor}</div>
              <div class="city-row">
                <span>${leg.from_location}</span>
                <span class="arrow">→</span>
                <span>${leg.to_location}</span>
              </div>
            </div>
            <div>
              <div class="cost">${money(leg.cost)}</div>
              <div class="details">${leg.details || ""}</div>
            </div>
          </div>`
          )
          .join("")}
      </div>
      <div class="card-footer">
        <div>Тариф: ${money(route.tariff_cost)} · Море: ${money(route.sea_cost)} · Ж/д: ${money(route.rail_cost)} · Охрана: ${money(route.security_cost)}</div>
        <div>${route.notices && route.notices.length ? `<span class="notes">${route.notices.join(" • ")}</span>` : ""}</div>
      </div>
      <div class="services">
        <h4>Дополнительные услуги</h4>
        <div class="services-list">
          ${extraServices
            .map(
              (service, sIndex) => `
            <label class="service-item">
              <input type="checkbox" data-service-index="${sIndex}" />
              <span>${service.name}</span>
              <span class="muted">+${money(service.price)}</span>
            </label>`
            )
            .join("")}
        </div>
        <div class="total-line">Итого с доп. услугами: <span class="total-display">${money(baseTotal)}</span></div>
      </div>
    `;
    resultsEl.appendChild(card);
  });
  attachServiceHandlers();
}

function attachServiceHandlers() {
  const cards = document.querySelectorAll(".route-card");
  cards.forEach((card) => {
    const checkboxes = card.querySelectorAll("input[type='checkbox']");
    checkboxes.forEach((box) => {
      box.addEventListener("change", () => updateCardTotal(card));
    });
  });
}

function updateCardTotal(card) {
  const base = Number(card.dataset.baseTotal);
  let extra = 0;
  const checks = card.querySelectorAll("input[type='checkbox']:checked");
  checks.forEach((chk) => {
    const idx = Number(chk.dataset.serviceIndex);
    extra += extraServices[idx]?.price || 0;
  });
  const total = base + extra;
  card.querySelectorAll(".total-display").forEach((el) => {
    el.textContent = money(total);
  });
}

function sortByPrice() {
  if (!lastRoutes.length) return;
  const sorted = [...lastRoutes].sort((a, b) => a.total_cost - b.total_cost);
  renderRoutes(sorted);
}

formEl.addEventListener("submit", searchRoutes);
sortPriceBtn.addEventListener("click", sortByPrice);
loadOptions();
