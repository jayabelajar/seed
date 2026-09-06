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
      borderColor: "#f87171",
      backgroundColor: "rgba(248, 113, 113, 0.1)",
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
    },
    {
      label: "Kelembapan Udara (%)",
      data: history.map((item) => item.humidity),
      borderColor: "#60a5fa",
      backgroundColor: "rgba(96, 165, 250, 0.1)",
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
    },
    {
      label: "Kelembapan Media (%)",
      data: history.map((item) => item.soil_moisture),
      borderColor: "#34d399",
      backgroundColor: "rgba(52, 211, 153, 0.1)",
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
    },
    {
      label: "Cahaya (lux / 10)",
      data: history.map((item) => Math.round(item.light_intensity / 10)),
      borderColor: "#fbbf24",
      backgroundColor: "rgba(251, 191, 36, 0.1)",
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
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
        legend: {
          position: "bottom",
          labels: {
            color: "#a1a1aa",
            font: { family: "Inter", size: 12 },
            usePointStyle: true,
            boxWidth: 8,
          },
        },
        tooltip: {
          backgroundColor: "rgba(24, 24, 27, 0.95)",
          titleColor: "#f4f4f5",
          bodyColor: "#d4d4d8",
          borderColor: "#3f3f46",
          borderWidth: 1,
          padding: 10,
          boxPadding: 4,
          usePointStyle: true,
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: "rgba(39, 39, 42, 0.6)" },
          ticks: { color: "#a1a1aa", font: { family: "Inter", size: 11 } },
        },
        x: {
          grid: { display: false },
          ticks: { color: "#a1a1aa", font: { family: "Inter", size: 11 } },
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
          <td class="font-medium text-zinc-300">${new Date(item.created_at).toLocaleString("id-ID")}</td>
          <td><span class="inline-flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-rose-400"></span>${item.temperature} °C</span></td>
          <td><span class="inline-flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-blue-400"></span>${item.humidity}%</span></td>
          <td><span class="inline-flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>${item.soil_moisture}%</span></td>
          <td><span class="inline-flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>${Math.round(item.light_intensity)} lux</span></td>
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
      try {
        const result = await getJson("/api/pump/control", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        await refreshDeviceStatus();
        const list = document.getElementById("pumpLogList");
        if (list) {
          const item = document.createElement("li");
          item.innerHTML = `<i data-lucide="power" class="h-4 w-4 text-emerald-400 shrink-0 mt-0.5"></i> <span>Pompa <strong class="text-zinc-100">${result.log.status}</strong> mode <strong>${result.log.mode}</strong> durasi <strong>${result.log.duration}</strong> dtk</span>`;
          list.prepend(item);
          if (window.lucide) lucide.createIcons();
        }

        // Trigger Alpine Toast Event
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: {
              message: `Perintah Pompa ${result.log.status} (${result.log.mode}) berhasil dikirim!`,
              type: "success",
            },
          }),
        );
      } catch (err) {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: {
              message: `Gagal mengirim perintah: ${err.message}`,
              type: "error",
            },
          }),
        );
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

