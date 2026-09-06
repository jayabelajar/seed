let sensorChart;
let dashCharts = {};

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function generateSimulatedHistory(pointsCount = 12) {
  const points = [];
  const now = new Date();
  for (let i = pointsCount - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 10 * 60 * 1000);
    const idx = pointsCount - i;
    points.push({
      created_at: time.toISOString(),
      temperature: +(28.2 + Math.sin(idx / 2) * 1.6 + (Math.random() * 0.4 - 0.2)).toFixed(1),
      humidity: +(77.0 + Math.cos(idx / 2.5) * 4.5 + (Math.random() * 0.8 - 0.4)).toFixed(1),
      soil_moisture: +(66.0 + Math.sin(idx / 3) * 5.2 + (Math.random() * 1.0 - 0.5)).toFixed(1),
      light_intensity: Math.round(810 + Math.cos(idx / 2) * 110 + (Math.random() * 24 - 12)),
    });
  }
  return points;
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

function getThemeColors() {
  const isDark = document.documentElement.classList.contains("dark");
  return {
    isDark,
    textColor: isDark ? "#a1a1aa" : "#475569",
    gridColor: isDark ? "rgba(39, 39, 42, 0.6)" : "rgba(226, 232, 240, 0.9)",
    tooltipBg: isDark ? "rgba(24, 24, 27, 0.95)" : "rgba(255, 255, 255, 0.98)",
    tooltipTitle: isDark ? "#f4f4f5" : "#0f172a",
    tooltipBody: isDark ? "#d4d4d8" : "#334155",
    tooltipBorder: isDark ? "#3f3f46" : "#cbd5e1",
    tempStroke: isDark ? "#f87171" : "#ef4444",
    tempFill: isDark ? "rgba(248, 113, 113, 0.15)" : "rgba(239, 68, 68, 0.08)",
    humidityStroke: isDark ? "#60a5fa" : "#2563eb",
    humidityFill: isDark ? "rgba(96, 165, 250, 0.15)" : "rgba(37, 99, 235, 0.08)",
    soilStroke: isDark ? "#34d399" : "#10b981",
    soilFill: isDark ? "rgba(52, 211, 153, 0.15)" : "rgba(16, 185, 129, 0.08)",
    lightStroke: isDark ? "#fbbf24" : "#d97706",
    lightFill: isDark ? "rgba(251, 191, 36, 0.15)" : "rgba(217, 119, 6, 0.08)",
  };
}

function chartDatasets(history, theme = getThemeColors()) {
  return [
    {
      label: "Suhu Udara (°C)",
      data: history.map((item) => item.temperature),
      borderColor: theme.tempStroke,
      backgroundColor: theme.tempFill,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
    },
    {
      label: "Kelembapan Udara (%)",
      data: history.map((item) => item.humidity),
      borderColor: theme.humidityStroke,
      backgroundColor: theme.humidityFill,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
    },
    {
      label: "Kelembapan Media (%)",
      data: history.map((item) => item.soil_moisture),
      borderColor: theme.soilStroke,
      backgroundColor: theme.soilFill,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
    },
    {
      label: "Cahaya (lux / 10)",
      data: history.map((item) => Math.round(item.light_intensity / 10)),
      borderColor: theme.lightStroke,
      backgroundColor: theme.lightFill,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
    },
  ];
}

function createSingleChartConfig(labels, labelText, data, strokeColor, fillColor) {
  const theme = getThemeColors();
  return {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: labelText,
          data,
          borderColor: strokeColor,
          backgroundColor: fillColor,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 2.5,
          pointHoverRadius: 4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipTitle,
          bodyColor: theme.tooltipBody,
          borderColor: theme.tooltipBorder,
          borderWidth: 1,
          padding: 8,
          boxPadding: 4,
          usePointStyle: true,
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: theme.gridColor },
          ticks: { color: theme.textColor, font: { family: "Inter", size: 10 } },
        },
        x: {
          grid: { display: false },
          ticks: { color: theme.textColor, font: { family: "Inter", size: 10 } },
        },
      },
    },
  };
}

async function renderDashboardMultiCharts(endpoint) {
  let history = [];
  try {
    history = await getJson(endpoint);
  } catch (err) {
    console.warn("API history fetch error, using simulated telemetry:", err);
  }

  if (!history || !Array.isArray(history) || history.length === 0) {
    history = generateSimulatedHistory(12);
  }

  const labels = history.map((item) => formatTime(item.created_at));
  const theme = getThemeColors();

  const configs = {
    chartTemperature: { label: "SuhuUdara (°C)", data: history.map((i) => i.temperature), stroke: theme.tempStroke, fill: theme.tempFill },
    chartHumidity: { label: "Kelembapan Udara (%)", data: history.map((i) => i.humidity), stroke: theme.humidityStroke, fill: theme.humidityFill },
    chartSoil: { label: "Kelembapan Media (%)", data: history.map((i) => i.soil_moisture), stroke: theme.soilStroke, fill: theme.soilFill },
    chartLight: { label: "Intensitas Cahaya (lux)", data: history.map((i) => Math.round(i.light_intensity)), stroke: theme.lightStroke, fill: theme.lightFill },
  };

  Object.entries(configs).forEach(([canvasId, cfg]) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (dashCharts[canvasId]) {
      dashCharts[canvasId].data.labels = labels;
      dashCharts[canvasId].data.datasets[0].data = cfg.data;
      dashCharts[canvasId].data.datasets[0].borderColor = cfg.stroke;
      dashCharts[canvasId].data.datasets[0].backgroundColor = cfg.fill;
      dashCharts[canvasId].options.plugins.tooltip.backgroundColor = theme.tooltipBg;
      dashCharts[canvasId].options.plugins.tooltip.titleColor = theme.tooltipTitle;
      dashCharts[canvasId].options.plugins.tooltip.bodyColor = theme.tooltipBody;
      dashCharts[canvasId].options.plugins.tooltip.borderColor = theme.tooltipBorder;
      dashCharts[canvasId].options.scales.y.grid.color = theme.gridColor;
      dashCharts[canvasId].options.scales.y.ticks.color = theme.textColor;
      dashCharts[canvasId].options.scales.x.ticks.color = theme.textColor;
      dashCharts[canvasId].update();
    } else {
      dashCharts[canvasId] = new Chart(canvas, createSingleChartConfig(labels, cfg.label, cfg.data, cfg.stroke, cfg.fill));
    }
  });

  // Update snippet table sensor on dashboard
  const dashSensorTable = document.getElementById("dashSensorTable");
  if (dashSensorTable) {
    dashSensorTable.innerHTML = history
      .slice(-6)
      .reverse()
      .map(
        (item) => `
          <tr class="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
            <td class="font-semibold text-zinc-700 dark:text-zinc-200 text-[11px]">${formatTime(item.created_at)}</td>
            <td><span class="text-rose-600 dark:text-rose-400 font-medium text-xs">${item.temperature}°C</span></td>
            <td><span class="text-blue-600 dark:text-blue-400 font-medium text-xs">${item.humidity}%</span></td>
            <td><span class="text-emerald-600 dark:text-emerald-400 font-medium text-xs">${item.soil_moisture}%</span></td>
            <td><span class="text-amber-600 dark:text-amber-400 font-medium text-xs">${Math.round(item.light_intensity)} lx</span></td>
          </tr>
        `,
      )
      .join("");
  }
}

async function renderSensorChart(endpoint) {
  const canvas = document.getElementById("sensorChart");
  if (!canvas) return;

  let history = [];
  try {
    history = await getJson(endpoint);
  } catch (err) {
    console.warn("API history fetch error for monitoring, using simulated data:", err);
  }

  if (!history || !Array.isArray(history) || history.length === 0) {
    history = generateSimulatedHistory(12);
  }

  const labels = history.map((item) => formatTime(item.created_at));
  const theme = getThemeColors();

  if (sensorChart) {
    sensorChart.data.labels = labels;
    sensorChart.data.datasets = chartDatasets(history, theme);
    sensorChart.options.plugins.legend.labels.color = theme.textColor;
    sensorChart.options.plugins.tooltip.backgroundColor = theme.tooltipBg;
    sensorChart.options.plugins.tooltip.titleColor = theme.tooltipTitle;
    sensorChart.options.plugins.tooltip.bodyColor = theme.tooltipBody;
    sensorChart.options.plugins.tooltip.borderColor = theme.tooltipBorder;
    sensorChart.options.scales.y.grid.color = theme.gridColor;
    sensorChart.options.scales.y.ticks.color = theme.textColor;
    sensorChart.options.scales.x.ticks.color = theme.textColor;
    sensorChart.update();
    return;
  }

  sensorChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: chartDatasets(history, theme),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: theme.textColor,
            font: { family: "Inter", size: 12 },
            usePointStyle: true,
            boxWidth: 8,
          },
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipTitle,
          bodyColor: theme.tooltipBody,
          borderColor: theme.tooltipBorder,
          borderWidth: 1,
          padding: 10,
          boxPadding: 4,
          usePointStyle: true,
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: theme.gridColor },
          ticks: { color: theme.textColor, font: { family: "Inter", size: 11 } },
        },
        x: {
          grid: { display: false },
          ticks: { color: theme.textColor, font: { family: "Inter", size: 11 } },
        },
      },
    },
  });
}

async function refreshLatestSensor() {
  try {
    const sensor = await getJson("/api/sensors/latest");
    updateSensorCards(sensor);
  } catch (err) {
    // Silent catch
  }
}

function updateHistoryTable(history) {
  const table = document.getElementById("historyTable");
  if (!table) return;

  table.innerHTML = history
    .slice(-12)
    .reverse()
    .map(
      (item) => `
        <tr class="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
          <td class="font-medium text-zinc-700 dark:text-zinc-300 text-xs">${formatTime(item.created_at)}</td>
          <td><span class="inline-flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200"><span class="h-1.5 w-1.5 rounded-full bg-rose-500"></span>${item.temperature} °C</span></td>
          <td><span class="inline-flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200"><span class="h-1.5 w-1.5 rounded-full bg-blue-500"></span>${item.humidity}%</span></td>
          <td><span class="inline-flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200"><span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>${item.soil_moisture}%</span></td>
          <td><span class="inline-flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200"><span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>${Math.round(item.light_intensity)} lux</span></td>
        </tr>
      `,
    )
    .join("");
}

async function refreshDeviceStatus() {
  try {
    const device = await getJson("/api/device/status");
    const pumpStatus = document.getElementById("pumpStatus");
    const pumpMode = document.getElementById("pumpMode");
    const esp32 = document.getElementById("deviceEsp32");
    const dashPumpStatus = document.getElementById("dashPumpStatus");
    const dashPumpMode = document.getElementById("dashPumpMode");

    if (pumpStatus) pumpStatus.textContent = device.pump.status;
    if (pumpMode) pumpMode.textContent = device.pump.mode;
    if (esp32) esp32.textContent = device.esp32.status;
    if (dashPumpStatus) dashPumpStatus.textContent = device.pump.status;
    if (dashPumpMode) dashPumpMode.textContent = `Mode ${device.pump.mode}`;
  } catch (err) {
    // Silent catch
  }
}

function setupRangeFilter() {
  const select = document.getElementById("rangeFilter");
  if (!select) return;

  select.addEventListener("change", async () => {
    const endpoint = `/api/sensors/history?hours=${select.value}`;
    await renderSensorChart(endpoint);
    try {
      updateHistoryTable(await getJson(endpoint));
    } catch (err) {
      updateHistoryTable(generateSimulatedHistory(12));
    }
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
          item.innerHTML = `<i data-lucide="power" class="h-4 w-4 text-emerald-400 shrink-0 mt-0.5"></i> <span>Pompa <strong class="text-zinc-900 dark:text-zinc-100">${result.log.status}</strong> mode <strong>${result.log.mode}</strong> durasi <strong>${result.log.duration}</strong> dtk</span>`;
          list.prepend(item);
          if (window.lucide) lucide.createIcons();
        }

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

function updateAllChartsTheme() {
  const theme = getThemeColors();

  if (sensorChart) {
    sensorChart.options.plugins.legend.labels.color = theme.textColor;
    sensorChart.options.plugins.tooltip.backgroundColor = theme.tooltipBg;
    sensorChart.options.plugins.tooltip.titleColor = theme.tooltipTitle;
    sensorChart.options.plugins.tooltip.bodyColor = theme.tooltipBody;
    sensorChart.options.plugins.tooltip.borderColor = theme.tooltipBorder;
    sensorChart.options.scales.y.grid.color = theme.gridColor;
    sensorChart.options.scales.y.ticks.color = theme.textColor;
    sensorChart.options.scales.x.ticks.color = theme.textColor;

    if (sensorChart.data.datasets && sensorChart.data.datasets.length >= 4) {
      sensorChart.data.datasets[0].borderColor = theme.tempStroke;
      sensorChart.data.datasets[0].backgroundColor = theme.tempFill;
      sensorChart.data.datasets[1].borderColor = theme.humidityStroke;
      sensorChart.data.datasets[1].backgroundColor = theme.humidityFill;
      sensorChart.data.datasets[2].borderColor = theme.soilStroke;
      sensorChart.data.datasets[2].backgroundColor = theme.soilFill;
      sensorChart.data.datasets[3].borderColor = theme.lightStroke;
      sensorChart.data.datasets[3].backgroundColor = theme.lightFill;
    }
    sensorChart.update();
  }

  const chartThemeMap = {
    chartTemperature: { stroke: theme.tempStroke, fill: theme.tempFill },
    chartHumidity: { stroke: theme.humidityStroke, fill: theme.humidityFill },
    chartSoil: { stroke: theme.soilStroke, fill: theme.soilFill },
    chartLight: { stroke: theme.lightStroke, fill: theme.lightFill },
  };

  Object.entries(dashCharts).forEach(([canvasId, chart]) => {
    if (!chart) return;
    const cfg = chartThemeMap[canvasId];
    if (cfg && chart.data.datasets[0]) {
      chart.data.datasets[0].borderColor = cfg.stroke;
      chart.data.datasets[0].backgroundColor = cfg.fill;
    }
    chart.options.plugins.tooltip.backgroundColor = theme.tooltipBg;
    chart.options.plugins.tooltip.titleColor = theme.tooltipTitle;
    chart.options.plugins.tooltip.bodyColor = theme.tooltipBody;
    chart.options.plugins.tooltip.borderColor = theme.tooltipBorder;
    chart.options.scales.y.grid.color = theme.gridColor;
    chart.options.scales.y.ticks.color = theme.textColor;
    chart.options.scales.x.ticks.color = theme.textColor;
    chart.update();
  });
}

window.addEventListener("theme-changed", () => {
  updateAllChartsTheme();
});

document.addEventListener("DOMContentLoaded", async () => {
  setupRangeFilter();
  setupPumpControls();

  if (window.pageChart) {
    if (window.pageChart.type === "dashboard_multi") {
      await renderDashboardMultiCharts(window.pageChart.endpoint);
    } else {
      await renderSensorChart(window.pageChart.endpoint);
    }
  }

  window.setInterval(async () => {
    await refreshLatestSensor();
    await refreshDeviceStatus();
    if (window.pageChart) {
      if (window.pageChart.type === "dashboard_multi") {
        await renderDashboardMultiCharts(window.pageChart.endpoint);
      } else {
        await renderSensorChart(window.pageChart.endpoint);
      }
    }
  }, 5000);
});
