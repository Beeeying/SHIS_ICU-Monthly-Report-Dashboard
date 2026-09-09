/**
 * HGH ICU Monthly Report Dashboard
 * charts.js
 *
 * Purpose:
 * - Render all Chart.js visualizations
 * - Map dashboard JSON data to chart components
 * - Reuse visual rules from chart-config.js
 * - Destroy and recreate charts safely when filters change
 *
 * Data / UI responsibilities:
 *
 * dashboard.js
 *   → loads data
 *   → manages filters
 *   → selects active dataset
 *   → calls ICUCharts.renderAll(dataset)
 *
 * charts.js
 *   → receives already-selected dataset
 *   → renders charts
 *
 * chart-config.js
 *   → owns shared colors / tooltip / axis / styling rules
 */

"use strict";

(function () {

  /* ========================================================================
     1. Dependencies
     ======================================================================== */

  function getChartConfig() {

    if (!window.ICUChartConfig) {

      console.error(
        "ICUChartConfig is not available. Load chart-config.js before charts.js."
      );

      return null;

    }

    return window.ICUChartConfig;

  }


  /* ========================================================================
     2. Chart registry
     ======================================================================== */

  /**
   * Store Chart.js instances here.
   *
   * Important:
   * Chart.js does not allow a new chart to reuse the same canvas
   * before the previous chart instance is destroyed.
   *
   * Example:
   *
   * chartInstances.overviewWard
   * chartInstances.patientAge
   */

  const chartInstances = {};


  /* ========================================================================
     3. Generic chart lifecycle helpers
     ======================================================================== */

  function destroyChart(chartKey) {

    const chart =
      chartInstances[chartKey];

    if (chart) {

      chart.destroy();

      delete chartInstances[chartKey];

    }

  }


  function destroyAllCharts() {

    Object.keys(chartInstances)
      .forEach(destroyChart);

  }


  /**
   * The current index.html uses <div> placeholders.
   *
   * When Chart.js implementation starts, each placeholder should contain
   * or be replaced by:
   *
   * <canvas id="..."></canvas>
   *
   * This helper retrieves a canvas safely.
   */

  function getCanvas(canvasId) {

    const canvas =
      document.getElementById(canvasId);

    if (!canvas) {

      console.warn(
        `Chart canvas not found: #${canvasId}`
      );

      return null;

    }

    return canvas;

  }


  /* ========================================================================
     4. Data helpers
     ======================================================================== */

  function getLabels(items = []) {

    return items.map(
      (item) => item.label
    );

  }


  function getCounts(items = []) {

    return items.map(
      (item) => item.count
    );

  }


  function getPercentages(items = []) {

    return items.map(
      (item) => item.percentage
    );

  }


  /**
   * Create a standard Chart.js dataset from:
   *
   * [
   *   {
   *     label: "ICU",
   *     count: 16,
   *     percentage: 39.0
   *   }
   * ]
   *
   * `percentages` is intentionally attached as custom metadata
   * because chart-config.js uses it for tooltips.
   */

  function buildDataset(
    items,
    {
      label = "",
      style = {}
    } = {}
  ) {

    return {

      label,

      data:
        getCounts(items),

      percentages:
        getPercentages(items),

      ...style

    };

  }


  /* ========================================================================
     5. Empty-state helper
     ======================================================================== */

  function hasChartData(items) {

    return (
      Array.isArray(items) &&
      items.length > 0 &&
      items.some(
        (item) => Number(item.count) > 0
      )
    );

  }


  /**
   * Future implementation:
   *
   * Instead of creating an empty chart, show:
   *
   * "No data available for the selected filters."
   */

  function handleEmptyChart(
    chartKey,
    canvasId,
    items
  ) {

    if (hasChartData(items)) {
      return false;
    }

    destroyChart(chartKey);

    console.info(
      `No chart data for ${canvasId}`
    );

    return true;

  }


  /* ========================================================================
     6. Generic chart builders
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

    if (
      handleEmptyChart(
        chartKey,
        canvasId,
        items
      )
    ) {
      return;
    }


    const canvas =
      getCanvas(canvasId);

    if (!canvas) {
      return;
    }


    const config =
      getChartConfig();

    if (!config) {
      return;
    }


    destroyChart(chartKey);


    const labels =
      getLabels(items);


    const backgroundColor =
      colors || color || config.COLORS.primary;


    const datasetStyle =
      config.getBarDatasetStyle({
        color:
          Array.isArray(backgroundColor)
            ? config.COLORS.primary
            : backgroundColor
      });


    const dataset =
      buildDataset(
        items,
        {
          style: {
            ...datasetStyle,
            backgroundColor
          }
        }
      );


    const tooltipCallbacks =
      config.createCountPercentageTooltip(
        unitSingular,
        unitPlural
      );


    chartInstances[chartKey] =
      new Chart(
        canvas,
        {
          type: "bar",

          data: {
            labels,
            datasets: [dataset]
          },

          options:
            config.getVerticalBarOptions({
              tooltipCallbacks,
              showLegend: false
            })
        }
      );

  }


  function createHorizontalBarChart({
    chartKey,
    canvasId,
    items,
    color,
    unitSingular = "admission",
    unitPlural = "admissions"
  }) {

    if (
      handleEmptyChart(
        chartKey,
        canvasId,
        items
      )
    ) {
      return;
    }


    const canvas =
      getCanvas(canvasId);

    if (!canvas) {
      return;
    }


    const config =
      getChartConfig();

    if (!config) {
      return;
    }


    destroyChart(chartKey);


    const dataset =
      buildDataset(
        items,
        {
          style:
            config.getBarDatasetStyle({
              color:
                color ||
                config.COLORS.primary
            })
        }
      );


    const tooltipCallbacks =
      config.createCountPercentageTooltip(
        unitSingular,
        unitPlural
      );


    chartInstances[chartKey] =
      new Chart(
        canvas,
        {
          type: "bar",

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
              showLegend: false
            })
        }
      );

  }


  function createDoughnutChart({
    chartKey,
    canvasId,
    items,
    colors,
    unitSingular = "admission",
    unitPlural = "admissions"
  }) {

    if (
      handleEmptyChart(
        chartKey,
        canvasId,
        items
      )
    ) {
      return;
    }


    const canvas =
      getCanvas(canvasId);

    if (!canvas) {
      return;
    }


    const config =
      getChartConfig();

    if (!config) {
      return;
    }


    destroyChart(chartKey);


    const dataset =
      buildDataset(
        items,
        {
          style:
            config.getDoughnutDatasetStyle({
              colors
            })
        }
      );


    const tooltipCallbacks =
      config.createCountPercentageTooltip(
        unitSingular,
        unitPlural
      );


    chartInstances[chartKey] =
      new Chart(
        canvas,
        {
          type: "doughnut",

          data: {

            labels:
              getLabels(items),

            datasets: [
              dataset
            ]

          },

          options:
            config.getDoughnutOptions({
              tooltipCallbacks,
              showLegend: true
            })

        }
      );

  }


  /* ========================================================================
     7. ICU Overview
     ======================================================================== */

  function renderOverviewCharts(dataset) {

    const config =
      getChartConfig();

    if (!config) {
      return;
    }


    /*
     * 1. Admissions by Ward
     * Doughnut
     */

    const wardData =
      dataset?.patientProfile
        ?.wardDistribution || [];


    createDoughnutChart({

      chartKey:
        "overviewWard",

      canvasId:
        "overview-ward-chart",

      items:
        wardData,

      colors:
        config.getWardColors(
          getLabels(wardData)
        )

    });


    /*
     * 2. Patient Disposition
     * Horizontal bar
     */

    createHorizontalBarChart({

      chartKey:
        "overviewDisposition",

      canvasId:
        "overview-disposition-chart",

      items:
        dataset?.clinicalProfile
          ?.disposition || []

    });


    /*
     * 3. Age Distribution
     * Vertical bar
     */

    createVerticalBarChart({

      chartKey:
        "overviewAge",

      canvasId:
        "overview-age-chart",

      items:
        dataset?.patientProfile
          ?.ageGroupDistribution || [],

      color:
        config.COLORS.primary

    });


    /*
     * 4. Admission Source
     * Horizontal bar
     */

    createHorizontalBarChart({

      chartKey:
        "overviewAdmissionSource",

      canvasId:
        "overview-admission-source-chart",

      items:
        dataset?.clinicalProfile
          ?.admissionSource || []

    });

  }


  /* ========================================================================
     8. Patient Profile
     ======================================================================== */

  function renderPatientProfileCharts(dataset) {

    const config =
      getChartConfig();

    if (!config) {
      return;
    }


    /*
     * Age Group Distribution
     */

    createVerticalBarChart({

      chartKey:
        "patientAge",

      canvasId:
        "patient-age-chart",

      items:
        dataset?.patientProfile
          ?.ageGroupDistribution || [],

      color:
        config.COLORS.primary

    });


    /*
     * Sex Distribution
     */

    const sexData =
      dataset?.patientProfile
        ?.sexDistribution || [];


    createDoughnutChart({

      chartKey:
        "patientSex",

      canvasId:
        "patient-sex-chart",

      items:
        sexData,

      colors:
        config.getSexColors(
          getLabels(sexData)
        )

    });


    /*
     * Admissions by Ward
     */

    const wardData =
      dataset?.patientProfile
        ?.wardDistribution || [];


    createDoughnutChart({

      chartKey:
        "patientWard",

      canvasId:
        "patient-ward-chart",

      items:
        wardData,

      colors:
        config.getWardColors(
          getLabels(wardData)
        )

    });


    /*
     * LOS Distribution
     */

    createVerticalBarChart({

      chartKey:
        "patientLos",

      canvasId:
        "patient-los-chart",

      items:
        dataset?.patientProfile
          ?.losDistribution || [],

      color:
        config.COLORS.primary

    });

  }


  /* ========================================================================
     9. Clinical Profile
     ======================================================================== */

  function renderClinicalProfileCharts(dataset) {

    const config =
      getChartConfig();

    if (!config) {
      return;
    }


    /*
     * Admission Source
     */

    createHorizontalBarChart({

      chartKey:
        "clinicalAdmissionSource",

      canvasId:
        "clinical-admission-source-chart",

      items:
        dataset?.clinicalProfile
          ?.admissionSource || []

    });


    /*
     * Patient Disposition
     */

    createHorizontalBarChart({

      chartKey:
        "clinicalDisposition",

      canvasId:
        "clinical-disposition-chart",

      items:
        dataset?.clinicalProfile
          ?.disposition || []

    });


    /*
     * Primary Diagnosis Category
     */

    const categoryData =
      dataset?.clinicalProfile
        ?.diagnosisCategory || [];


    createVerticalBarChart({

      chartKey:
        "clinicalDiagnosisCategory",

      canvasId:
        "clinical-diagnosis-category-chart",

      items:
        categoryData,

      colors:
        config.getDiagnosisCategoryColors(
          getLabels(categoryData)
        )

    });


    /*
     * ICD-10 Chapter
     */

    createHorizontalBarChart({

      chartKey:
        "clinicalIcd",

      canvasId:
        "clinical-icd-chart",

      items:
        dataset?.clinicalProfile
          ?.icdChapter || []

    });

  }


  /* ========================================================================
     10. Mortality Review
     ======================================================================== */

  function renderMortalityCharts(dataset) {

    const config =
      getChartConfig();

    if (!config) {
      return;
    }


    const mortality =
      dataset?.mortalityReview;

    if (!mortality) {
      return;
    }


    /*
     * Deaths by Diagnosis Category
     */

    const categoryData =
      mortality.diagnosisCategory || [];


    createVerticalBarChart({

      chartKey:
        "mortalityDiagnosisCategory",

      canvasId:
        "mortality-diagnosis-category-chart",

      items:
        categoryData,

      colors:
        config.getDiagnosisCategoryColors(
          getLabels(categoryData)
        ),

      unitSingular:
        "death",

      unitPlural:
        "deaths"

    });


    /*
     * Deaths by ICD-10 Chapter
     */

    createHorizontalBarChart({

      chartKey:
        "mortalityIcd",

      canvasId:
        "mortality-icd-chart",

      items:
        mortality.icdChapter || [],

      color:
        config.COLORS.lavender,

      unitSingular:
        "death",

      unitPlural:
        "deaths"

    });


    /*
     * LOS among Death Cases
     */

    createVerticalBarChart({

      chartKey:
        "mortalityLos",

      canvasId:
        "mortality-los-chart",

      items:
        mortality.losDistribution || [],

      color:
        config.COLORS.lavender,

      unitSingular:
        "death",

      unitPlural:
        "deaths"

    });


    /*
     * Admission Source among Death Cases
     */

    createHorizontalBarChart({

      chartKey:
        "mortalityAdmissionSource",

      canvasId:
        "mortality-admission-source-chart",

      items:
        mortality.admissionSource || [],

      color:
        config.COLORS.lavender,

      unitSingular:
        "death",

      unitPlural:
        "deaths"

    });

  }


  /* ========================================================================
     11. Render all dashboard charts
     ======================================================================== */

  function renderAll(dataset) {

    if (!dataset) {

      console.warn(
        "No dataset provided to ICUCharts.renderAll()."
      );

      return;

    }


    renderOverviewCharts(dataset);

    renderPatientProfileCharts(dataset);

    renderClinicalProfileCharts(dataset);

    renderMortalityCharts(dataset);

  }


  /* ========================================================================
     12. Public API
     ======================================================================== */

  window.ICUCharts =
    Object.freeze({

      renderAll,

      renderOverviewCharts,

      renderPatientProfileCharts,

      renderClinicalProfileCharts,

      renderMortalityCharts,

      destroyAllCharts

    });

})();