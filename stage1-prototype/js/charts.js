/**
 * HGH ICU Monthly Report Dashboard
 * charts.js
 *
 * Stage 1 Reference Implementation
 *
 * Implemented:
 *
* ICU Overview V2
* ├── Admissions by Ward
* ├── Mortality by Ward
* ├── Admissions Over Time
* └── Length of Stay by Ward
 *
 *
 * Architecture:
 *
 * mock_august_data.json
 *        ↓
 * dashboard.js
 *        ↓
 * active dataset
 *        ↓
 * ICUCharts.renderAll(dataset)
 *        ↓
 * charts.js
 *        ↓
 * ICUChartConfig
 *        ↓
 * Chart.js
 */

"use strict";

(function () {

  /* ========================================================================
     1. Dependencies
     ======================================================================== */

  function getChartConfig() {

    if (!window.ICUChartConfig) {

      console.error(
        "ICUChartConfig is not available. " +
        "Make sure chart-config.js is loaded before charts.js."
      );

      return null;
    }

    return window.ICUChartConfig;
  }


  function isChartJsAvailable() {

    if (typeof Chart === "undefined") {

      console.error(
        "Chart.js is not available. " +
        "Make sure Chart.js is loaded before chart-config.js and charts.js."
      );

      return false;
    }

    return true;
  }


  /* ========================================================================
     2. Chart registry
     ======================================================================== */

  /**
   * Store every active Chart.js instance here.
   *
   * Before a chart is rendered again,
   * the previous instance must be destroyed.
   */

  const chartInstances = {};


  /* ========================================================================
     3. Chart lifecycle
     ======================================================================== */

  function destroyChart(chartKey) {

    const chart =
      chartInstances[chartKey];

    if (!chart) {
      return;
    }

    chart.destroy();

    delete chartInstances[chartKey];
  }


  function destroyAllCharts() {

    Object.keys(chartInstances)
      .forEach(destroyChart);
  }


  /* ========================================================================
     4. DOM helpers
     ======================================================================== */

  function getCanvas(canvasId) {

    const canvas =
      document.getElementById(canvasId);

    if (!canvas) {

      console.warn(
        `Chart canvas not found: #${canvasId}`
      );

      return null;
    }


    if (
      canvas.tagName.toLowerCase() !== "canvas"
    ) {

      console.warn(
        `#${canvasId} exists but is not a <canvas> element.`
      );

      return null;
    }

    return canvas;
  }


  /* ========================================================================
     5. Data helpers
     ======================================================================== */

  function getLabels(items = []) {

    return items.map(
      (item) => item.label
    );
  }


  function getCounts(items = []) {

    return items.map(
      (item) =>
        Number(item.count) || 0
    );
  }


  function getPercentages(items = []) {

    return items.map(
      (item) => {

        const value =
          Number(item.percentage);

        return Number.isFinite(value)
          ? value
          : null;
      }
    );
  }


  function getTotalCount(items = []) {

    return items.reduce(
      (total, item) =>
        total +
        (Number(item.count) || 0),
      0
    );
  }


  function hasChartData(items) {

    return (
      Array.isArray(items) &&
      items.length > 0 &&
      items.some(
        (item) =>
          Number(item.count) > 0
      )
    );
  }


  /**
   * Sort a copy of an array by count descending.
   *
   * Original JSON data is not mutated.
   */

  function sortByCountDescending(
    items = []
  ) {

    return [...items].sort(
      (a, b) =>
        Number(b.count || 0) -
        Number(a.count || 0)
    );
  }


  /**
   * Apply a fixed semantic ordering.
   *
   * Any unexpected / future categories
   * are placed after the preferred categories.
   */

  function applyPreferredOrder(
    items = [],
    preferredOrder = []
  ) {

    const orderMap =
      new Map(
        preferredOrder.map(
          (label, index) => [
            label,
            index
          ]
        )
      );


    return [...items].sort(
      (a, b) => {

        const aOrder =
          orderMap.has(a.label)
            ? orderMap.get(a.label)
            : Number.MAX_SAFE_INTEGER;


        const bOrder =
          orderMap.has(b.label)
            ? orderMap.get(b.label)
            : Number.MAX_SAFE_INTEGER;


        return aOrder - bOrder;
      }
    );
  }


  /* ========================================================================
     6. Empty-state handling
     ======================================================================== */

  function showEmptyState(
    canvas,
    message =
      "No data available for the selected filters."
  ) {

    const container =
      canvas.parentElement;

    if (!container) {
      return;
    }


    canvas.hidden = true;


    let emptyState =
      container.querySelector(
        ".chart-empty-state"
      );


    if (!emptyState) {

      emptyState =
        document.createElement("div");

      emptyState.className =
        "chart-empty-state";

      /*
       * Override outer empty-state dimensions
       * because this element lives inside chart-container.
       */

      emptyState.style.width =
        "100%";

      emptyState.style.height =
        "100%";

      emptyState.style.margin =
        "0";


      container.appendChild(
        emptyState
      );
    }


    emptyState.textContent =
      message;
  }


  function clearEmptyState(canvas) {

    const container =
      canvas.parentElement;

    if (!container) {
      return;
    }


    const emptyState =
      container.querySelector(
        ".chart-empty-state"
      );


    if (emptyState) {
      emptyState.remove();
    }


    canvas.hidden = false;
  }


  /* ========================================================================
     7. Doughnut centre-label plugin
     ======================================================================== */

  /**
   * Displays:
   *
   *       41
   *   Admissions
   *
   * in the centre of the ward doughnut.
   */

  const doughnutCenterLabelPlugin = {

    id:
      "icuDoughnutCenterLabel",


    afterDraw(chart) {

      const options =
        chart.options
          ?.plugins
          ?.icuDoughnutCenterLabel;


      if (
        !options ||
        options.display === false
      ) {
        return;
      }


      const {
        ctx,
        chartArea
      } = chart;


      if (!chartArea) {
        return;
      }


      const centerX =
        (
          chartArea.left +
          chartArea.right
        ) / 2;


      const centerY =
        (
          chartArea.top +
          chartArea.bottom
        ) / 2;


      const config =
        getChartConfig();


      const textPrimary =
        config?.COLORS?.textPrimary ||
        "#1F2933";


      const textSecondary =
        config?.COLORS?.textSecondary ||
        "#667085";


      const fontFamily =
        config?.FONT_FAMILY ||
        "Arial, sans-serif";


      ctx.save();


      ctx.textAlign =
        "center";

      ctx.textBaseline =
        "middle";


      /* Main total */

      ctx.fillStyle =
        textPrimary;

      ctx.font =
        `700 26px ${fontFamily}`;

      ctx.fillText(
        String(options.total ?? 0),
        centerX,
        centerY - 8
      );


      /* Supporting text */

      ctx.fillStyle =
        textSecondary;

      ctx.font =
        `500 11px ${fontFamily}`;

      ctx.fillText(
        options.label ||
        "Admissions",
        centerX,
        centerY + 16
      );


      ctx.restore();
    }
  };


  /* ========================================================================
     8. Doughnut / pie value label plugin
     ======================================================================== */

  const doughnutValueLabelPlugin = {
    id: "doughnutValueLabelPlugin",

    afterDatasetsDraw(chart) {
      const type = chart.config.type;

      if (type !== "doughnut" && type !== "pie") {
        return;
      }

      const ctx = chart.ctx;
      const dataset = chart.data.datasets[0];
      const meta = chart.getDatasetMeta(0);

      if (!meta || !dataset || !Array.isArray(dataset.data)) {
        return;
      }

      const fontFamily =
        getChartConfig()?.FONT_FAMILY ||
        "Inter, sans-serif";

      ctx.save();
      ctx.font = `600 11px ${fontFamily}`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      meta.data.forEach((arc, index) => {
        const value = Number(dataset.data[index]);

        if (Number.isNaN(value) || value <= 0) {
          return;
        }

        const angle = (arc.startAngle + arc.endAngle) / 2;
        const radius = (arc.outerRadius + arc.innerRadius) / 2;
        const x = arc.x + Math.cos(angle) * radius;
        const y = arc.y + Math.sin(angle) * radius;

        ctx.fillText(String(value), x, y);
      });

      ctx.restore();
    }
  };


  /* ========================================================================
     9. Generic vertical bar builder
     ======================================================================== */

  function createVerticalBarChart({
    chartKey,
    canvasId,
    items,
    color,
    colors = null,
    unitSingular = "admission",
    unitPlural = "admissions"
  }) {

    if (!isChartJsAvailable()) {
      return;
    }


    const config =
      getChartConfig();

    if (!config) {
      return;
    }


    const canvas =
      getCanvas(canvasId);

    if (!canvas) {
      return;
    }


    if (!hasChartData(items)) {

      destroyChart(chartKey);

      showEmptyState(canvas);

      return;
    }


    clearEmptyState(canvas);

    destroyChart(chartKey);


    const backgroundColor =
      colors ||
      color ||
      config.COLORS.primary;


    const style =
      config.getBarDatasetStyle({

        color:
          Array.isArray(backgroundColor)
            ? config.COLORS.primary
            : backgroundColor
      });


    const dataset = {

      label:
        "Admissions",

      data:
        getCounts(items),

      percentages:
        getPercentages(items),

      ...style,

      backgroundColor
    };


    const tooltipCallbacks =
      config.createCountPercentageTooltip(
        unitSingular,
        unitPlural
      );


    chartInstances[chartKey] =
      new Chart(
        canvas,
        {

          type:
            "bar",


          data: {

            labels:
              getLabels(items),

            datasets: [
              dataset
            ]
          },


          options:
            config.getVerticalBarOptions({

              tooltipCallbacks,

              showLegend:
                false
            })
        }
      );
  }


  /* ========================================================================
     9. Generic horizontal bar builder
     ======================================================================== */

  function createHorizontalBarChart({
    chartKey,
    canvasId,
    items,
    color,
    unitSingular = "admission",
    unitPlural = "admissions"
  }) {

    if (!isChartJsAvailable()) {
      return;
    }


    const config =
      getChartConfig();

    if (!config) {
      return;
    }


    const canvas =
      getCanvas(canvasId);

    if (!canvas) {
      return;
    }


    if (!hasChartData(items)) {

      destroyChart(chartKey);

      showEmptyState(canvas);

      return;
    }


    clearEmptyState(canvas);

    destroyChart(chartKey);


    const chartColor =
      color ||
      config.COLORS.primary;


    const dataset = {

      label:
        "Admissions",

      data:
        getCounts(items),

      percentages:
        getPercentages(items),

      ...config.getBarDatasetStyle({
        color:
          chartColor
      })
    };


    const tooltipCallbacks =
      config.createCountPercentageTooltip(
        unitSingular,
        unitPlural
      );


    chartInstances[chartKey] =
      new Chart(
        canvas,
        {

          type:
            "bar",


          data: {

            labels:
              getLabels(items),

            datasets: [
              dataset
            ]
          },


          options:
            config.getHorizontalBarOptions({

              tooltipCallbacks,

              showLegend:
                false
            })
        }
      );
  }


  /* ========================================================================
     10. ICU Overview — Admissions by Ward
     ======================================================================== */

  function renderOverviewWardChart(
    dataset
  ) {

    const chartKey =
      "overviewWard";


    const canvasId =
      "overview-ward-chart";


    if (!isChartJsAvailable()) {
      return;
    }


    const config =
      getChartConfig();

    if (!config) {
      return;
    }


    const canvas =
      getCanvas(canvasId);

    if (!canvas) {
      return;
    }


    const wardData =
      dataset
        ?.patientProfile
        ?.wardDistribution || [];


    if (!hasChartData(wardData)) {

      destroyChart(chartKey);

      showEmptyState(canvas);

      return;
    }


    clearEmptyState(canvas);

    destroyChart(chartKey);


    const labels =
      getLabels(wardData);


    const counts =
      getCounts(wardData);


    const percentages =
      getPercentages(wardData);


    const totalAdmissions =
      getTotalCount(wardData);


    const colors =
      config.getWardColors(
        labels
      );


    const datasetStyle =
      config.getDoughnutDatasetStyle({
        colors
      });


    const chartDataset = {

      label:
        "Admissions",

      data:
        counts,

      percentages,

      ...datasetStyle
    };


    const tooltipCallbacks =
      config.createCountPercentageTooltip(
        "admission",
        "admissions"
      );


    const options =
      config.getDoughnutOptions({

        tooltipCallbacks,

        showLegend:
          true
      });


    options.plugins =
      options.plugins || {};


    options.plugins
      .icuDoughnutCenterLabel = {

        display:
          true,

        total:
          totalAdmissions,

        label:
          totalAdmissions === 1
            ? "Admission"
            : "Admissions"
      };


    chartInstances[chartKey] =
      new Chart(
        canvas,
        {

          type:
            "doughnut",


          data: {

            labels,

            datasets: [
              chartDataset
            ]
          },


          options,


          plugins: [
            doughnutCenterLabelPlugin,
            doughnutValueLabelPlugin
          ]
        }
      );
  }


/* ========================================================================
   11. ICU Overview — Mortality by Ward
   ======================================================================== */

function renderOverviewMortalityByWardChart(dataset) {

  const chartKey =
    "overviewMortalityByWard";

  const canvasId =
    "overview-mortality-ward-chart";


  if (!isChartJsAvailable()) {
    return;
  }


  const config =
    getChartConfig();

  if (!config) {
    return;
  }


  const canvas =
    getCanvas(canvasId);

  if (!canvas) {
    return;
  }


  const rawData =
    dataset
      ?.overviewCharts
      ?.mortalityByWard || [];


  /*
   * Expected JSON structure:
   *
   * {
   *   label: "ICU",
   *   admissions: 16,
   *   deaths: 10,
   *   mortalityRate: 62.5
   * }
   */

  const mortalityData =
    rawData.map(
      (item) => ({
        label:
          item.label,

        count:
          Number(item.deaths) || 0,

        percentage:
          Number.isFinite(
            Number(item.mortalityRate)
          )
            ? Number(item.mortalityRate)
            : null
      })
    );


  /*
   * Do not use hasChartData() here.
   *
   * A ward with 0 deaths is still valid data and should
   * remain visible in the chart.
   */

  if (
    !Array.isArray(mortalityData) ||
    mortalityData.length === 0
  ) {

    destroyChart(chartKey);

    showEmptyState(canvas);

    return;
  }


  clearEmptyState(canvas);

  destroyChart(chartKey);


  const labels =
    getLabels(mortalityData);


  const colors =
    config.getWardColors(
      labels
    );


  const tooltipCallbacks =
    config.createCountPercentageTooltip(
      "death",
      "deaths"
    );


  const options =
    config.getHorizontalBarOptions({

      tooltipCallbacks,

      showLegend:
        false
    });


  chartInstances[chartKey] =
    new Chart(
      canvas,
      {

        type:
          "bar",

        data: {

          labels,

          datasets: [
            {

              label:
                "Deaths",

              data:
                getCounts(
                  mortalityData
                ),

              percentages:
                getPercentages(
                  mortalityData
                ),

              ...config.getBarDatasetStyle({
                color:
                  config.COLORS.primary
              }),

              backgroundColor:
                colors,

              borderColor:
                colors
            }
          ]
        },

        options
      }
    );
}



/* ========================================================================
   12. ICU Overview — Admissions Over Time
   ======================================================================== */

function formatOverviewDateLabel(
  dateString,
  includeYear = false
) {

  if (!dateString) {
    return "";
  }


  const parts =
    String(dateString)
      .split("-")
      .map(Number);


  if (
    parts.length !== 3 ||
    parts.some(
      (value) =>
        !Number.isFinite(value)
    )
  ) {

    return String(dateString);
  }


  const [
    year,
    month,
    day
  ] = parts;


  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );


  return new Intl.DateTimeFormat(
    "en-GB",
    {

      day:
        "numeric",

      month:
        "short",

      ...(includeYear
        ? {
            year:
              "numeric"
          }
        : {}),

      timeZone:
        "UTC"
    }
  ).format(date);
}



function renderOverviewAdmissionsOverTimeChart(
  dataset
) {

  const chartKey =
    "overviewAdmissionsOverTime";

  const canvasId =
    "overview-admissions-time-chart";


  if (!isChartJsAvailable()) {
    return;
  }


  const config =
    getChartConfig();

  if (!config) {
    return;
  }


  const canvas =
    getCanvas(canvasId);

  if (!canvas) {
    return;
  }


  const timeData =
    dataset
      ?.overviewCharts
      ?.admissionsOverTime || [];


  /*
   * Zero-admission days are valid observations.
   *
   * Example:
   * Aug 31 = 0 admissions
   *
   * This date must still appear in the time series.
   */

  const hasTimeSeries =
    Array.isArray(timeData) &&
    timeData.length > 0 &&
    timeData.some(
      (item) =>
        Number.isFinite(
          Number(item.count)
        )
    );


  if (!hasTimeSeries) {

    destroyChart(chartKey);

    showEmptyState(canvas);

    return;
  }


  clearEmptyState(canvas);

  destroyChart(chartKey);


  const labels =
    timeData.map(
      (item) =>
        formatOverviewDateLabel(
          item.date
        )
    );


  const counts =
    timeData.map(
      (item) =>
        Number(item.count) || 0
    );


  const fullDateLabels =
    timeData.map(
      (item) =>
        formatOverviewDateLabel(
          item.date,
          true
        )
    );


  const textSecondary =
    config.COLORS
      ?.textSecondary ||
    "#667085";


  const gridColor =
    config.COLORS
      ?.grid ||
    "rgba(31, 41, 51, 0.08)";


  chartInstances[chartKey] =
    new Chart(
      canvas,
      {

        type:
          "line",

        data: {

          labels,

          datasets: [
            {

              label:
                "Admissions",

              data:
                counts,

              borderColor:
                config.COLORS.primary,

              backgroundColor:
                config.COLORS.primary,

              borderWidth:
                2.25,

              pointRadius:
                3,

              pointHoverRadius:
                5,

              pointBorderWidth:
                0,

              tension:
                0.25,

              fill:
                false
            }
          ]
        },


        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,


          interaction: {

            mode:
              "index",

            intersect:
              false
          },


          plugins: {

            legend: {

              display:
                false
            },


            tooltip: {

              callbacks: {

                title(items) {

                  if (!items?.length) {
                    return "";
                  }


                  const index =
                    items[0]
                      .dataIndex;


                  return (
                    fullDateLabels[index] ||
                    items[0].label ||
                    ""
                  );
                },


                label(context) {

                  const count =
                    Number(
                      context.raw
                    ) || 0;


                  const unit =
                    count === 1
                      ? "admission"
                      : "admissions";


                  return (
                    `${count} ${unit}`
                  );
                }
              }
            }
          },


          scales: {

            x: {

              grid: {

                display:
                  false
              },


              ticks: {

                color:
                  textSecondary,

                autoSkip:
                  true,

                maxTicksLimit:
                  11,

                maxRotation:
                  0
              }
            },


            y: {

              beginAtZero:
                true,


              grid: {

                color:
                  gridColor
              },


              ticks: {

                color:
                  textSecondary,

                precision:
                  0
              }
            }
          }
        }
      }
    );
}



/* ========================================================================
   13. ICU Overview — Length of Stay by Ward
   ======================================================================== */

function renderOverviewLosByWardChart(
  dataset
) {

  const chartKey =
    "overviewLosByWard";

  const canvasId =
    "overview-los-ward-chart";


  if (!isChartJsAvailable()) {
    return;
  }


  const config =
    getChartConfig();

  if (!config) {
    return;
  }


  const canvas =
    getCanvas(canvasId);

  if (!canvas) {
    return;
  }


  const losData =
    dataset
      ?.overviewCharts
      ?.losByWard || [];


  const hasLosData =
    Array.isArray(losData) &&
    losData.length > 0 &&
    losData.some(
      (item) =>

        Number.isFinite(
          Number(item.meanLos)
        ) ||

        Number.isFinite(
          Number(item.medianLos)
        )
    );


  if (!hasLosData) {

    destroyChart(chartKey);

    showEmptyState(canvas);

    return;
  }


  clearEmptyState(canvas);

  destroyChart(chartKey);


  const labels =
    losData.map(
      (item) =>
        item.label
    );


  const meanLos =
    losData.map(
      (item) => {

        const value =
          Number(
            item.meanLos
          );


        return Number.isFinite(
          value
        )
          ? value
          : null;
      }
    );


  const medianLos =
    losData.map(
      (item) => {

        const value =
          Number(
            item.medianLos
          );


        return Number.isFinite(
          value
        )
          ? value
          : null;
      }
    );


  const tooltipCallbacks = {

    title(items) {

      if (!items?.length) {
        return "";
      }


      return (
        items[0].label ||
        ""
      );
    },


    label(context) {

      const value =
        Number(
          context.raw
        );


      const formatted =
        Number.isFinite(value)
          ? value.toFixed(1)
          : "—";


      return (
        `${context.dataset.label}: ` +
        `${formatted} days`
      );
    }
  };


  const options =
    config.getVerticalBarOptions({

      tooltipCallbacks,

      showLegend:
        true
    });


  if (
    options
      ?.plugins
      ?.legend
  ) {

    options
      .plugins
      .legend
      .position =
        "bottom";
  }


  /*
   * LOS is a continuous measure.
   *
   * Mean LOS may contain decimal values,
   * so the y-axis should not be restricted
   * to integer ticks.
   */

  if (
    options
      ?.scales
      ?.y
      ?.ticks
  ) {

    delete options
      .scales
      .y
      .ticks
      .precision;
  }


  chartInstances[chartKey] =
    new Chart(
      canvas,
      {

        type:
          "bar",

        data: {

          labels,

          datasets: [

            {

              label:
                "Mean LOS",

              data:
                meanLos,

              ...config.getBarDatasetStyle({
                color:
                  config.COLORS.primary
              })
            },


            {

              label:
                "Median LOS",

              data:
                medianLos,

              ...config.getBarDatasetStyle({
                color:
                  config.COLORS.lavender
              })
            }
          ]
        },

        options
      }
    );
}



/* ========================================================================
   14. ICU Overview renderer
   ======================================================================== */

function renderOverviewCharts(
  dataset
) {

  if (!dataset) {

    console.warn(
      "No dataset provided to ICUCharts.renderOverviewCharts()."
    );

    return;
  }


  renderOverviewWardChart(
    dataset
  );


  renderOverviewMortalityByWardChart(
    dataset
  );


  renderOverviewAdmissionsOverTimeChart(
    dataset
  );


  renderOverviewLosByWardChart(
    dataset
  );
}


/* ========================================================================
   15. Patient Profile — Sex Distribution
   ======================================================================== */

function renderPatientSexChart(
  dataset
) {

  const chartKey =
    "patientSex";


  const canvas =
    getCanvas(
      "patient-sex-chart"
    );


  const config =
    getChartConfig();


  const items =
    dataset
      ?.patientProfile
      ?.sexDistribution || [];


  if (
    !canvas ||
    !config ||
    !isChartJsAvailable()
  ) {

    return;
  }


  if (!hasChartData(items)) {

    destroyChart(
      chartKey
    );


    showEmptyState(
      canvas
    );


    return;
  }


  clearEmptyState(
    canvas
  );


  destroyChart(
    chartKey
  );


  const options =
    config.getDoughnutOptions({

      tooltipCallbacks:
        config.createCountPercentageTooltip(
          "admission",
          "admissions"
        ),

      showLegend:
        true
    });


  options.plugins =
    options.plugins || {};


  options.plugins.legend =
    options.plugins.legend || {};


  options.plugins
    .legend
    .position =
      "right";


  options.plugins
    .icuDoughnutCenterLabel = {

      display:
        true,

      total:
        getTotalCount(
          items
        ),

      label:
        "Admissions"
    };


  chartInstances[chartKey] =
    new Chart(
      canvas,
      {

        type:
          "doughnut",

        data: {

          labels:
            getLabels(
              items
            ),

          datasets: [
            {

              label:
                "Admissions",

              data:
                getCounts(
                  items
                ),

              percentages:
                getPercentages(
                  items
                ),

              ...config.getDoughnutDatasetStyle({

                colors: [
                  config.COLORS.primary,
                  config.COLORS.lavender
                ]
              })
            }
          ]
        },


        options,


        plugins: [

          doughnutCenterLabelPlugin,

          doughnutValueLabelPlugin
        ]
      }
    );
}


  function renderPatientProfileCharts(
    dataset
  ) {

    const patientProfile = dataset?.patientProfile;

    if (!patientProfile) {
      return;
    }

    createVerticalBarChart({
      chartKey: "patientAge",
      canvasId: "patient-age-chart",
      items: patientProfile.ageGroupDistribution || [],
      color: getChartConfig()?.COLORS?.primary
    });

    renderPatientSexChart(dataset);

    createVerticalBarChart({
      chartKey: "patientLos",
      canvasId: "patient-los-chart",
      items: patientProfile.losDistribution || [],
      color: getChartConfig()?.COLORS?.primary,
      unitSingular: "day",
      unitPlural: "days"
    });
  }


function renderPrimaryDiagnosisTable(dataset) {

  const rows =
    dataset?.clinicalProfile?.primaryDiagnosisCounts || [];

  const tableBody =
    document.querySelector(
      "#primary-diagnosis-table tbody"
    );

  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = "";

  if (!Array.isArray(rows) || rows.length === 0) {

    const emptyRow =
      document.createElement("tr");

    emptyRow.innerHTML =
      '<td colspan="5">No diagnosis data available.</td>';

    tableBody.appendChild(emptyRow);

    return;
  }

  /*
   * Percentage denominator:
   * selected ICU/HDU admission cohort.
   *
   * This keeps the definition consistent across
   * All / ICU / HDU filters.
   */
  const totalAdmissions =
    Number(
      dataset?.overview?.totalAdmissions ||
      dataset?.patientProfile?.summary?.totalAdmissions ||
      getTotalCount(
        dataset?.patientProfile?.wardDistribution || []
      )
    ) || 0;

  const rankedRows =
    [...rows]
      .map((row) => {

        const label =
          row.label || "Unspecified diagnosis";

        const separatorIndex =
          label.indexOf(" - ");

        return {

          code:
            separatorIndex >= 0
              ? label
                  .slice(0, separatorIndex)
                  .trim()
              : "—",

          diagnosis:
            separatorIndex >= 0
              ? label
                  .slice(separatorIndex + 3)
                  .trim()
              : label,

          count:
            Number(row.count || 0)
        };
      })
      .sort(
        (a, b) =>
          Number(b.count) -
          Number(a.count)
      )
      .slice(0, 5);

  rankedRows.forEach(
    (row, index) => {

      const tr =
        document.createElement("tr");

      const percentage =
        totalAdmissions > 0
          ? (
              (row.count / totalAdmissions) *
              100
            ).toFixed(1)
          : "0.0";

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${row.diagnosis}</td>
        <td>${row.code}</td>
        <td>${row.count}</td>
        <td>${percentage}%</td>
      `;

      tableBody.appendChild(tr);
    }
  );
}


  function renderClinicalProfileCharts(dataset) {

    const clinicalProfile = dataset?.clinicalProfile;

    if (!clinicalProfile) {
      return;
    }

    const config = getChartConfig();
    const admissionSourceData = sortByCountDescending(
      clinicalProfile.admissionSource || []
    );

    createHorizontalBarChart({
      chartKey: "clinicalAdmissionSource",
      canvasId: "clinical-admission-source-chart",
      items: admissionSourceData,
      color: config?.COLORS?.primary
    });

    const dispositionData = applyPreferredOrder(
      clinicalProfile.disposition || [],
      [
        "Transfer to General Ward",
        "Death in ICU",
        "Still in Admission",
        "Transfer to Another Facility"
      ]
    );

    createHorizontalBarChart({
      chartKey: "clinicalDisposition",
      canvasId: "clinical-disposition-chart",
      items: dispositionData,
      color: config?.COLORS?.primary
    });

    const diagnosisCategoryData = clinicalProfile.diagnosisCategory || [];
    const diagnosisLabels = getLabels(diagnosisCategoryData);
    const totalDiagnosisCount = getTotalCount(diagnosisCategoryData);

    const chartKey = "clinicalDiagnosisCategory";
    const canvas = getCanvas("clinical-diagnosis-category-chart");

    if (canvas && config && isChartJsAvailable()) {
      if (!hasChartData(diagnosisCategoryData)) {
        destroyChart(chartKey);
        showEmptyState(canvas);
      } else {
        clearEmptyState(canvas);
        destroyChart(chartKey);

        const options = config.getDoughnutOptions({
          tooltipCallbacks: config.createCountPercentageTooltip("admission", "admissions"),
          showLegend: true
        });

        options.plugins.legend.position = "bottom";
        options.plugins.icuDoughnutCenterLabel = {
          display: true,
          total: totalDiagnosisCount,
          label: totalDiagnosisCount === 1 ? "Diagnosis" : "Diagnoses"
        };

        chartInstances[chartKey] = new Chart(canvas, {
          type: "doughnut",
          data: {
            labels: diagnosisLabels,
            datasets: [{
              label: "Diagnoses",
              data: getCounts(diagnosisCategoryData),
              percentages: getPercentages(diagnosisCategoryData),
              ...config.getDoughnutDatasetStyle({
                colors: config.getDiagnosisCategoryColors(diagnosisLabels)
              })
            }]
          },
          options,
          plugins: [doughnutCenterLabelPlugin]
        });
      }
    }

    createHorizontalBarChart({
      chartKey: "clinicalIcd",
      canvasId: "clinical-icd-chart",
      items: sortByCountDescending(clinicalProfile.icdChapter || []),
      color: config?.COLORS?.primary
    });

    renderPrimaryDiagnosisTable(dataset);
  }


  function renderMortalityCharts(
    dataset
  ) {

    const mortalityReview = dataset?.mortalityReview;

    if (!mortalityReview) {
      return;
    }

    const config = getChartConfig();

    if (!config) {
      return;
    }

    const diagnosisColors =
      (mortalityReview.diagnosisCategory || []).map(
        (item) =>
          config.SEMANTIC_COLORS?.diagnosisCategory?.[item.label] ||
          config.COLORS.primary
      );

    createVerticalBarChart({
      chartKey: "mortalityDiagnosisCategory",
      canvasId: "mortality-diagnosis-category-chart",
      items: mortalityReview.diagnosisCategory || [],
      colors: diagnosisColors,
      unitSingular: "death",
      unitPlural: "deaths"
    });

    createHorizontalBarChart({
      chartKey: "mortalityIcdChapter",
      canvasId: "mortality-icd-chart",
      items: sortByCountDescending(mortalityReview.icdChapter || []),
      color: config.COLORS.primary,
      unitSingular: "death",
      unitPlural: "deaths"
    });

    createVerticalBarChart({
      chartKey: "mortalityLos",
      canvasId: "mortality-los-chart",
      items: mortalityReview.losDistribution || [],
      color: config.COLORS.primary,
      unitSingular: "death",
      unitPlural: "deaths"
    });

    createHorizontalBarChart({
      chartKey: "mortalityAdmissionSource",
      canvasId: "mortality-admission-source-chart",
      items: sortByCountDescending(mortalityReview.admissionSource || []),
      color: config.COLORS.primary,
      unitSingular: "death",
      unitPlural: "deaths"
    });
  }



  /* ========================================================================
     15. Main dashboard renderer
     ======================================================================== */
  /**
   * Render all dashboard chart groups
   * for the currently selected dataset.
   */

  function renderAll(
  dataset
) {

  if (!dataset) {

    console.warn(
      "No dataset provided to ICUCharts.renderAll()."
    );

    return;
  }

  renderOverviewCharts(
    dataset
  );

  renderPatientProfileCharts(
    dataset
  );

  renderClinicalProfileCharts(
    dataset
  );

  renderMortalityCharts(
    dataset
  );
}


  /* ========================================================================
     16. Public API
     ======================================================================== */

  window.ICUCharts =
    Object.freeze({

      renderAll,

      renderOverviewCharts,

      renderOverviewWardChart,

      renderOverviewMortalityByWardChart,

      renderOverviewAdmissionsOverTimeChart,

      renderOverviewLosByWardChart,

      renderPatientProfileCharts,

      renderClinicalProfileCharts,

      renderMortalityCharts,

      destroyAllCharts
    });

  })();