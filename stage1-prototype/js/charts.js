/**
 * HGH ICU Monthly Report Dashboard
 * charts.js
 *
 * Stage 1 Reference Implementation
 *
 * Implemented:
 *
 * ICU Overview
 * ├── Admissions by Ward
 * ├── Patient Disposition
 * ├── Age Distribution
 * └── Admission Source
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
     8. Generic vertical bar builder
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
            doughnutCenterLabelPlugin
          ]
        }
      );
  }


  /* ========================================================================
     11. ICU Overview — Patient Disposition
     ======================================================================== */

  function renderOverviewDispositionChart(
    dataset
  ) {

    const rawData =
      dataset
        ?.clinicalProfile
        ?.disposition || [];


    /*
     * Keep a stable clinical / reporting order.
     *
     * Do not sort this chart by count because disposition categories
     * represent meaningful outcome states rather than a ranking.
     */

    const dispositionOrder = [

      "Transfer to General Ward",

      "Death in ICU",

      "Still in Admission",

      "Transfer to Another Facility"
    ];


    const dispositionData =
      applyPreferredOrder(
        rawData,
        dispositionOrder
      );


    createHorizontalBarChart({

      chartKey:
        "overviewDisposition",

      canvasId:
        "overview-disposition-chart",

      items:
        dispositionData,

      color:
        getChartConfig()
          ?.COLORS
          ?.primary
    });
  }


  /* ========================================================================
     12. ICU Overview — Age Distribution
     ======================================================================== */

  function renderOverviewAgeChart(
    dataset
  ) {

    /*
     * Age groups are already stored in clinically meaningful
     * ordinal order in the dashboard dataset.
     *
     * Therefore do NOT sort by count.
     */

    const ageData =
      dataset
        ?.patientProfile
        ?.ageGroupDistribution || [];


    createVerticalBarChart({

      chartKey:
        "overviewAge",

      canvasId:
        "overview-age-chart",

      items:
        ageData,

      color:
        getChartConfig()
          ?.COLORS
          ?.primary
    });
  }


  /* ========================================================================
     13. ICU Overview — Admission Source
     ======================================================================== */

  function renderOverviewAdmissionSourceChart(
    dataset
  ) {

    const rawData =
      dataset
        ?.clinicalProfile
        ?.admissionSource || [];


    /*
     * Admission source is an unordered categorical distribution.
     *
     * Display largest source first.
     */

    const admissionSourceData =
      sortByCountDescending(
        rawData
      );


    createHorizontalBarChart({

      chartKey:
        "overviewAdmissionSource",

      canvasId:
        "overview-admission-source-chart",

      items:
        admissionSourceData,

      color:
        getChartConfig()
          ?.COLORS
          ?.primary
    });
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


    renderOverviewDispositionChart(
      dataset
    );


    renderOverviewAgeChart(
      dataset
    );


    renderOverviewAdmissionSourceChart(
      dataset
    );
  }


  /* ========================================================================
     15. Main dashboard renderer
     ======================================================================== */

  /**
   * Stage 1:
   *
   * Currently only ICU Overview charts are implemented.
   *
   * Future:
   *
   * renderOverviewCharts(dataset);
   * renderPatientProfileCharts(dataset);
   * renderClinicalProfileCharts(dataset);
   * renderMortalityCharts(dataset);
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
  }


  /* ========================================================================
     16. Public API
     ======================================================================== */

  window.ICUCharts =
    Object.freeze({

      renderAll,

      renderOverviewCharts,

      renderOverviewWardChart,

      renderOverviewDispositionChart,

      renderOverviewAgeChart,

      renderOverviewAdmissionSourceChart,

      destroyAllCharts
    });

})();