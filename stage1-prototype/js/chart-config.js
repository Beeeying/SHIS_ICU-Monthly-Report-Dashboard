/**
 * HGH ICU Monthly Report Dashboard
 * Shared Chart.js configuration
 *
 * Stage 1 purpose:
 * - Keep chart styling consistent across all dashboard tabs
 * - Centralize palette, tooltip, legend, axis, and interaction rules
 * - Prevent each chart from defining its own visual language
 *
 * Expected script order in index.html:
 *
 *   <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
 *   <script src="./js/chart-config.js"></script>
 *   <script src="./js/charts.js"></script>
 *   <script src="./js/dashboard.js"></script>
 *
 * This file does not create any charts by itself.
 */

"use strict";

(function () {

  /* ========================================================================
     1. Color palette
     ======================================================================== */

  const COLORS = Object.freeze({
    primary: "#5B5BD6",
    lavender: "#8B8FE8",
    blue: "#7DA0D4",
    violet: "#A78BCA",
    amber: "#D6A756",
    gray: "#B8C0CC",

    textPrimary: "#1F2933",
    textSecondary: "#667085",
    textMuted: "#98A2B3",

    gridline: "#E8EAF0",
    tooltipBackground: "#25303A",
    white: "#FFFFFF"
  });


  /* ========================================================================
     2. Semantic colors
     ======================================================================== */

  const SEMANTIC_COLORS = Object.freeze({

    diagnosisCategory: Object.freeze({
      NCD: COLORS.primary,
      Infectious: COLORS.lavender,
      Surgery: COLORS.blue,
      Other: COLORS.gray
    }),

    ward: Object.freeze({
      ICU: COLORS.primary,
      HDU: COLORS.lavender
    }),

    sex: Object.freeze({
      Male: COLORS.primary,
      Female: COLORS.blue
    })

  });


  /* ========================================================================
     3. Font and interaction defaults
     ======================================================================== */

  const FONT_FAMILY =
    'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  const INTERACTION = Object.freeze({
    mode: "nearest",
    intersect: true
  });


  /* ========================================================================
     4. Formatting helpers
     ======================================================================== */

  function formatNumber(value, maximumFractionDigits = 1) {

    if (
      value === null ||
      value === undefined ||
      Number.isNaN(Number(value))
    ) {
      return "—";
    }

    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits
    }).format(Number(value));

  }


  function formatPercent(value) {

    if (
      value === null ||
      value === undefined ||
      Number.isNaN(Number(value))
    ) {
      return "—";
    }

    return `${Number(value).toFixed(1)}%`;

  }


  function pluralize(count, singular, plural = `${singular}s`) {

    return Number(count) === 1
      ? singular
      : plural;

  }


  /* ========================================================================
     5. Tooltip helpers
     ======================================================================== */

  /**
   * charts.js should attach percentages to the dataset:
   *
   * dataset.percentages = [61.0, 39.0, ...]
   */

  function getPercentageFromContext(context) {

    const percentages =
      context?.dataset?.percentages;

    if (!Array.isArray(percentages)) {
      return null;
    }

    return percentages[context.dataIndex] ?? null;

  }


  /**
   * Standard categorical tooltip
   *
   * Example:
   *
   * Emergency Ward
   * 18 admissions
   * 43.9%
   */

  function createCountPercentageTooltip(
    singularUnit = "admission",
    pluralUnit = "admissions"
  ) {

    return {

      title(items) {

        if (!items?.length) {
          return "";
        }

        return items[0].label || "";

      },


      label(context) {

        const count =
          Number(context.raw ?? 0);

        const unit =
          pluralize(
            count,
            singularUnit,
            pluralUnit
          );

        return `${formatNumber(count, 0)} ${unit}`;

      },


      afterLabel(context) {

        const percentage =
          getPercentageFromContext(context);

        return percentage === null
          ? ""
          : formatPercent(percentage);

      }

    };

  }


  /* ========================================================================
     6. Tooltip options
     ======================================================================== */

  function getTooltipOptions(
    callbacks = createCountPercentageTooltip()
  ) {

    return {

      enabled: true,

      displayColors: false,

      backgroundColor:
        COLORS.tooltipBackground,

      titleColor:
        COLORS.white,

      bodyColor:
        COLORS.white,

      cornerRadius: 8,

      padding: 11,


      titleFont: {
        family: FONT_FAMILY,
        size: 13,
        weight: "600"
      },


      bodyFont: {
        family: FONT_FAMILY,
        size: 12,
        weight: "400"
      },


      callbacks

    };

  }


  /* ========================================================================
     7. Legend options
     ======================================================================== */

  function getLegendOptions({
    display = false,
    position = "bottom"
  } = {}) {

    return {

      display,

      position,


      labels: {

        usePointStyle: true,

        pointStyle: "circle",

        boxWidth: 8,

        boxHeight: 8,

        padding: 16,

        color:
          COLORS.textSecondary,


        font: {
          family: FONT_FAMILY,
          size: 12,
          weight: "500"
        }

      }

    };

  }


  /* ========================================================================
     8. Axis configuration
     ======================================================================== */

  function getCategoryAxis({
    displayGrid = false,
    autoSkip = false
  } = {}) {

    return {

      grid: {
        display: displayGrid,
        color: COLORS.gridline,
        drawBorder: false
      },


      border: {
        display: false
      },


      ticks: {

        color:
          COLORS.textSecondary,

        autoSkip,

        maxRotation: 0,

        minRotation: 0,


        font: {
          family: FONT_FAMILY,
          size: 11
        }

      }

    };

  }


  function getCountAxis({
    beginAtZero = true,
    precision = 0
  } = {}) {

    return {

      beginAtZero,


      grid: {

        display: true,

        color:
          COLORS.gridline,

        drawBorder: false

      },


      border: {
        display: false
      },


      ticks: {

        color:
          COLORS.textSecondary,

        precision,


        font: {
          family: FONT_FAMILY,
          size: 11
        }

      }

    };

  }


  /* ========================================================================
     9. Base chart options
     ======================================================================== */

  function getBaseOptions({
    showLegend = false,
    legendPosition = "bottom",
    tooltipCallbacks = createCountPercentageTooltip()
  } = {}) {

    return {

      responsive: true,

      maintainAspectRatio: false,


      animation: {

        duration: 320,

        easing: "easeOutQuart"

      },


      interaction: {
        ...INTERACTION
      },


      plugins: {

        legend:
          getLegendOptions({
            display: showLegend,
            position: legendPosition
          }),


        tooltip:
          getTooltipOptions(
            tooltipCallbacks
          )

      }

    };

  }


  /* ========================================================================
     10. Vertical bar options
     ======================================================================== */

  function getVerticalBarOptions({
    tooltipCallbacks = createCountPercentageTooltip(),
    showLegend = false
  } = {}) {

    const base =
      getBaseOptions({
        showLegend,
        tooltipCallbacks
      });


    return {

      ...base,


      scales: {

        x:
          getCategoryAxis({
            displayGrid: false,
            autoSkip: false
          }),


        y:
          getCountAxis({
            beginAtZero: true,
            precision: 0
          })

      }

    };

  }


  /* ========================================================================
     11. Horizontal bar options
     ======================================================================== */

  function getHorizontalBarOptions({
    tooltipCallbacks = createCountPercentageTooltip(),
    showLegend = false
  } = {}) {

    const base =
      getBaseOptions({
        showLegend,
        tooltipCallbacks
      });


    return {

      ...base,

      indexAxis: "y",


      scales: {

        x:
          getCountAxis({
            beginAtZero: true,
            precision: 0
          }),


        y:
          getCategoryAxis({
            displayGrid: false,
            autoSkip: false
          })

      }

    };

  }


  /* ========================================================================
     12. Doughnut options
     ======================================================================== */

  function getDoughnutOptions({
    tooltipCallbacks = createCountPercentageTooltip(),
    showLegend = true
  } = {}) {

    const base =
      getBaseOptions({
        showLegend,
        legendPosition: "bottom",
        tooltipCallbacks
      });


    return {

      ...base,

      cutout: "70%",


      layout: {
        padding: 6
      },


      elements: {

        arc: {

          borderWidth: 0,

          hoverOffset: 4

        }

      }

    };

  }


  /* ========================================================================
     13. Future line-chart options
     ======================================================================== */

  function getLineOptions({
    showLegend = true,
    yBeginAtZero = false,
    tooltipCallbacks = null
  } = {}) {

    const base =
      getBaseOptions({

        showLegend,

        legendPosition: "bottom",


        tooltipCallbacks:
          tooltipCallbacks || {

            title(items) {

              return items?.[0]?.label || "";

            },


            label(context) {

              const label =
                context.dataset.label
                  ? `${context.dataset.label}: `
                  : "";

              return `${label}${formatNumber(context.raw, 1)}`;

            }

          }

      });


    return {

      ...base,


      interaction: {

        mode: "index",

        intersect: false

      },


      scales: {

        x:
          getCategoryAxis({
            displayGrid: false,
            autoSkip: true
          }),


        y:
          getCountAxis({
            beginAtZero: yBeginAtZero,
            precision: 0
          })

      },


      elements: {

        line: {

          borderWidth: 2.25,

          tension: 0.15,

          fill: false

        },


        point: {

          radius: 3.5,

          hoverRadius: 5,

          borderWidth: 0

        }

      }

    };

  }


  /* ========================================================================
     14. Shared bar dataset style
     ======================================================================== */

  function getBarDatasetStyle({
    color = COLORS.primary
  } = {}) {

    return {

      backgroundColor: color,

      borderColor: color,

      borderWidth: 0,

      borderRadius: 7,

      borderSkipped: false,

      categoryPercentage: 0.72,

      barPercentage: 0.78,

      maxBarThickness: 48

    };

  }


  /* ========================================================================
     15. Shared doughnut dataset style
     ======================================================================== */

  function getDoughnutDatasetStyle({
    colors = [
      COLORS.primary,
      COLORS.lavender
    ]
  } = {}) {

    return {

      backgroundColor: colors,

      borderWidth: 0,

      hoverBorderWidth: 0,

      hoverOffset: 4

    };

  }


  /* ========================================================================
     16. Shared line dataset style
     ======================================================================== */

  function getLineDatasetStyle({
    color = COLORS.primary
  } = {}) {

    return {

      borderColor: color,

      backgroundColor: color,

      pointBackgroundColor: color,

      pointBorderColor: color,

      borderWidth: 2.25,

      pointRadius: 3.5,

      pointHoverRadius: 5,

      tension: 0.15,

      fill: false

    };

  }


  /* ========================================================================
     17. Semantic color helpers
     ======================================================================== */

  function getDiagnosisCategoryColors(labels) {

    return labels.map(
      (label) =>
        SEMANTIC_COLORS
          .diagnosisCategory[label]
        || COLORS.gray
    );

  }


  function getWardColors(labels) {

    return labels.map(
      (label) =>
        SEMANTIC_COLORS
          .ward[label]
        || COLORS.gray
    );

  }


  function getSexColors(labels) {

    return labels.map(
      (label) =>
        SEMANTIC_COLORS
          .sex[label]
        || COLORS.gray
    );

  }


  /* ========================================================================
     18. Global Chart.js defaults
     ======================================================================== */

  function applyGlobalDefaults() {

    if (typeof Chart === "undefined") {

      console.warn(
        "Chart.js has not been loaded yet. Load Chart.js before chart-config.js."
      );

      return;

    }


    Chart.defaults.font.family =
      FONT_FAMILY;


    Chart.defaults.color =
      COLORS.textSecondary;


    Chart.defaults.responsive =
      true;


    Chart.defaults.maintainAspectRatio =
      false;


    Chart.defaults.animation.duration =
      320;


    Chart.defaults.animation.easing =
      "easeOutQuart";


    Chart.defaults.plugins.legend.labels.color =
      COLORS.textSecondary;


    Chart.defaults.plugins.tooltip.backgroundColor =
      COLORS.tooltipBackground;

  }


  /* ========================================================================
     19. Public API
     ======================================================================== */

  window.ICUChartConfig =
    Object.freeze({

      COLORS,

      SEMANTIC_COLORS,

      FONT_FAMILY,


      formatNumber,

      formatPercent,

      pluralize,


      createCountPercentageTooltip,


      getTooltipOptions,

      getLegendOptions,


      getBaseOptions,

      getVerticalBarOptions,

      getHorizontalBarOptions,

      getDoughnutOptions,

      getLineOptions,


      getBarDatasetStyle,

      getDoughnutDatasetStyle,

      getLineDatasetStyle,


      getDiagnosisCategoryColors,

      getWardColors,

      getSexColors,


      applyGlobalDefaults

    });


  /* ========================================================================
     20. Apply defaults automatically
     ======================================================================== */

  if (typeof Chart !== "undefined") {

    applyGlobalDefaults();

  }

})();