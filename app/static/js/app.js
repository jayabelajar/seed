let sensorChart;

function formatTime(value) {
  return new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function updateSensorCards(sensor) {
  Object.entries(sensor).forEach(([key, value]) => {
    const element = document.querySelector(`[data-sensor="${key}"]`);
    if (!element) return;
    element.textContent = key === "light_intensity" ? Math.round(value) : value;
  });
}

function chartDatasets(history) {
  return [
    {
      label: "Suhu (°C)",
      data: history.map((item) => item.temperature),
      borderColor: "#dc2626",
      backgroundColor: "rgba(220, 38, 38, 0.08)",
      tension: 0.35,
    },
    {
      label: "Kelembapan Udara (%)",
      data: history.map((item) => item.humidity),
      borderColor: "#2563eb",
      backgroundColor: "rgba(37, 99, 235, 0.08)",
      tension: 0.35,
    },
    {
      label: "Kelembapan Media (%)",
      data: history.map((item) => item.soil_moisture),
      borderColor: "#059669",
      backgroundColor: "rgba(5, 150, 105, 0.08)",
      tension: 0.35,
    },
    {
      label: "Cahaya (lux / 10)",
      data: history.map((item) => Math.round(item.light_intensity / 10)),
      borderColor: "#ca8a04",
      backgroundColor: "rgba(202, 138, 4, 0.08)",
      tension: 0.35,
    },
  ];
}

async function renderSensorChart(endpoint) {
  const canvas = document.getElementById("sensorChart");
  if (!canvas) return;

  const history = await getJson(endpoint);
  const labels = history.map((item) => formatTime(item.created_at));

  if (sensorChart) {
    sensorChart.data.labels = labels;
    sensorChart.data.datasets = chartDatasets(history);
    sensorChart.update();
    return;
  }

  sensorChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: chartDatasets(history),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom" },
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: "#e2e8f0" },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  });
}

async function refreshLatestSensor() {
  const sensor = await getJson("/api/sensors/latest");
  updateSensorCards(sensor);
}

function updateHistoryTable(history) {
  const table = document.getElementById("historyTable");
  if (!table) return;

  table.innerHTML = history
    .slice(-12)
    .reverse()
    .map(
      (item) => `
        <tr>
          <td>${new Date(item.created_at).toLocaleString("id-ID")}</td>
          <td>${item.temperature} °C</td>
          <td>${item.humidity}%</td>
          <td>${item.soil_moisture}%</td>
          <td>${Math.round(item.light_intensity)} lux</td>
        </tr>
      `,
    )
    .join("");
}

async function refreshDeviceStatus() {
  const device = await getJson("/api/device/status");
  const pumpStatus = document.getElementById("pumpStatus");
  const pumpMode = document.getElementById("pumpMode");
  const esp32 = document.getElementById("deviceEsp32");

  if (pumpStatus) pumpStatus.textContent = device.pump.status;
  if (pumpMode) pumpMode.textContent = device.pump.mode;
  if (esp32) esp32.textContent = device.esp32.status;
}

function setupRangeFilter() {
  const select = document.getElementById("rangeFilter");
  if (!select) return;

  select.addEventListener("change", async () => {
    const endpoint = `/api/sensors/history?hours=${select.value}`;
    await renderSensorChart(endpoint);
    updateHistoryTable(await getJson(endpoint));
  });
}

function setupPumpControls() {
  const buttons = document.querySelectorAll("[data-pump]");
  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const mode = document.getElementById("pumpModeSelect")?.value || "Otomatis";
      const payload = {
        status: button.dataset.pump,
        mode,
        duration: button.dataset.pump === "ON" ? 45 : 0,
      };
      const result = await getJson("/api/pump/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await refreshDeviceStatus();
      const list = document.getElementById("pumpLogList");
      if (list) {
        const item = document.createElement("li");
        item.textContent = `Pompa ${result.log.status} mode ${result.log.mode} durasi ${result.log.duration} detik`;
        list.prepend(item);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  setupRangeFilter();
  setupPumpControls();

  if (window.pageChart) {
    await renderSensorChart(window.pageChart.endpoint);
  }

  window.setInterval(async () => {
    await refreshLatestSensor();
    await refreshDeviceStatus();
    if (window.pageChart) {
      await renderSensorChart(window.pageChart.endpoint);
    }
  }, 5000);
});
