"use strict";

/* ==========================================================================
   HGH ICU Monthly Report Dashboard
   Stage 1 — dashboard.js

   Current responsibilities:
   1. Load mock_august_data.json
   2. Populate KPI values from JSON
   3. Support All / ICU / HDU ward filtering
   4. Support four dashboard tabs
   5. Reset filters
   6. Populate cohort metadata

   Charts and detailed tables will be added later.
   ========================================================================== */


/* ==========================================================================
   1. Configuration
   ========================================================================== */

const DATA_URL = "./data/mock_august_data.json";

let dashboardData = null;


/* ==========================================================================
   2. DOM helpers
   ========================================================================== */

function byId(id) {
  return document.getElementById(id);
}


function setText(id, value) {
  const element = byId(id);

  if (!element) {
    console.warn(`Element not found: #${id}`);
    return;
  }

  element.textContent =
    value === null ||
    value === undefined ||
    value === ""
      ? "—"
      : String(value);
}


/* ==========================================================================
   3. Formatting helpers
   ========================================================================== */

function formatNumber(value) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return String(value);
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


function formatDate(isoDate) {
  if (!isoDate) {
    return "—";
  }

  const date = new Date(`${isoDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}


/* ==========================================================================
   4. Runtime messages
   ========================================================================== */

function showMessage(message, type = "info") {
  const element = byId("dashboard-message");

  if (!element) {
    return;
  }

  element.hidden = false;
  element.textContent = message;
  element.dataset.type = type;
}


function hideMessage() {
  const element = byId("dashboard-message");

  if (!element) {
    return;
  }

  element.hidden = true;
  element.textContent = "";
  element.removeAttribute("data-type");
}


/* ==========================================================================
   5. Metadata
   ========================================================================== */

function renderMetadata() {
  if (!dashboardData?.metadata) {
    return;
  }

  setText(
    "cohort-label",
    dashboardData.metadata.cohortLabel
  );

  setText(
    "data-through",
    formatDate(dashboardData.metadata.dataThrough)
  );
}


/* ==========================================================================
   6. Dataset selection
   ========================================================================== */

function getSelectedWard() {
  const wardFilter = byId("ward-filter");

  if (!wardFilter) {
    return "All";
  }

  return wardFilter.value;
}


function getActiveDataset() {
  const ward = getSelectedWard();

  if (!dashboardData?.datasets?.[ward]) {
    console.warn(
      `Dataset not found for ward filter: ${ward}`
    );

    return null;
  }

  return dashboardData.datasets[ward];
}


/* ==========================================================================
   7. Overview KPI rendering
   ========================================================================== */

function renderOverviewKpis(dataset) {
  const overview = dataset?.overview;

  if (!overview) {
    return;
  }

  setText(
    "overview-total-admissions",
    overview.totalAdmissions
  );

  setText(
    "overview-deaths",
    overview.deaths
  );

  setText(
    "overview-mortality-rate",
    formatPercent(overview.mortalityRate)
  );

  setText(
    "overview-mean-los",
    formatNumber(overview.meanLosDays)
  );

  setText(
    "overview-median-los",
    formatNumber(overview.medianLosDays)
  );
}


/* ==========================================================================
   8. Patient Profile KPI rendering
   ========================================================================== */

function renderPatientProfileKpis(dataset) {
  const summary =
    dataset?.patientProfile?.summary;

  if (!summary) {
    return;
  }

  setText(
    "patient-mean-age",
    formatNumber(summary.meanAge)
  );

  setText(
    "patient-median-age",
    formatNumber(summary.medianAge)
  );

  setText(
    "patient-mean-los",
    formatNumber(summary.meanLosDays)
  );

  setText(
    "patient-median-los",
    formatNumber(summary.medianLosDays)
  );
}


/* ==========================================================================
   9. Mortality Review KPI rendering
   ========================================================================== */

function renderMortalityKpis(dataset) {
  const summary =
    dataset?.mortalityReview?.summary;

  if (!summary) {
    return;
  }

  setText(
    "mortality-deaths",
    summary.deathCases
  );

  setText(
    "mortality-rate",
    formatPercent(summary.mortalityRate)
  );

  setText(
    "mortality-mean-age",
    formatNumber(summary.meanAge)
  );

  setText(
    "mortality-median-age",
    formatNumber(summary.medianAge)
  );

  setText(
    "mortality-mean-los",
    formatNumber(summary.meanLosDays)
  );

  setText(
    "mortality-median-los",
    formatNumber(summary.medianLosDays)
  );


  /* Death Cases Detail count */

  const deathCases =
    dataset?.mortalityReview?.deathCases;

  const caseCount =
    Array.isArray(deathCases)
      ? deathCases.length
      : summary.deathCases;

  setText(
    "death-case-count",
    `${caseCount} ${caseCount === 1 ? "case" : "cases"}`
  );
}


/* ==========================================================================
   10. Render all KPI sections
   ========================================================================== */

function renderDeathCaseTable(dataset = getActiveDataset()) {
  const table = byId("death-case-table");

  if (!table) {
    return;
  }

  const tbody = table.querySelector("tbody");

  if (!tbody) {
    return;
  }

  const cases = dataset?.mortalityReview?.deathCases || [];

  const searchInput = byId("death-case-search");
  const categoryFilter = byId("death-category-filter");
  const sortSelect = byId("death-sort");

  const searchTerm =
    (searchInput?.value || "").trim().toLowerCase();

  const categoryValue =
    categoryFilter?.value || "All";

  const sortValue =
    sortSelect?.value || "caseId";

  let filteredCases = [...cases];

  if (searchTerm) {
    filteredCases = filteredCases.filter((item) =>
      [
        item.caseId,
        item.ageGroup,
        item.sex,
        item.ward,
        item.admissionSource,
        item.diagnosisCategory,
        item.icdChapter
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm)
    );
  }

  if (categoryValue !== "All") {
    filteredCases = filteredCases.filter(
      (item) => item.diagnosisCategory === categoryValue
    );
  }

  if (sortValue === "los-desc") {
    filteredCases.sort((a, b) => Number(b.losDays) - Number(a.losDays));
  } else if (sortValue === "los-asc") {
    filteredCases.sort((a, b) => Number(a.losDays) - Number(b.losDays));
  } else {
    filteredCases.sort((a, b) => String(a.caseId).localeCompare(String(b.caseId)));
  }

  if (!filteredCases.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">No death cases match the selected filters.</td>
      </tr>
    `;
    setText("death-case-count", "0 cases");
    return;
  }

  tbody.innerHTML = filteredCases
    .map((item) => `
      <tr>
        <td>${item.caseId || "—"}</td>
        <td>${item.ageGroup || "—"}</td>
        <td>${item.sex || "—"}</td>
        <td>${item.ward || "—"}</td>
        <td>${item.admissionSource || "—"}</td>
        <td>${item.diagnosisCategory || "—"}</td>
        <td>${item.icdChapter || "—"}</td>
        <td>${item.losDays ?? "—"}</td>
        <td><button type="button" class="table-action-button" aria-label="View case ${item.caseId || "details"}">View</button></td>
      </tr>
    `)
    .join("");

  setText(
    "death-case-count",
    `${filteredCases.length} ${filteredCases.length === 1 ? "case" : "cases"}`
  );
}


function renderAllKpis() {
  const dataset = getActiveDataset();

  if (!dataset) {
    showMessage(
      "Unable to find data for the selected ward.",
      "error"
    );
    return;
  }

  hideMessage();

  /* ----------------------------------------------------------
     KPI rendering
     ---------------------------------------------------------- */

  renderOverviewKpis(dataset);
  renderPatientProfileKpis(dataset);
  renderMortalityKpis(dataset);
  renderDeathCaseTable(dataset);


  /* ----------------------------------------------------------
     Chart rendering
     ---------------------------------------------------------- */

  if (window.ICUCharts) {

    window.ICUCharts.renderAll(
      dataset
    );

  } else {

    console.warn(
      "ICUCharts is not available. Check that charts.js is loaded before dashboard.js."
    );

  }
}


/* ==========================================================================
   11. Dashboard tabs
   ========================================================================== */

function activateTab(tabId) {
  const tabButtons =
    document.querySelectorAll(".tab-button");

  const pages =
    document.querySelectorAll(".dashboard-page");


  /* Update tab buttons */

  tabButtons.forEach((button) => {
    const isActive =
      button.dataset.tab === tabId;

    button.classList.toggle(
      "active",
      isActive
    );

    button.setAttribute(
      "aria-selected",
      String(isActive)
    );
  });


  /* Update page visibility */

  pages.forEach((page) => {
    const isActive =
      page.id === tabId;

    page.classList.toggle(
      "active-page",
      isActive
    );

    page.hidden = !isActive;
  });
}


function setupTabs() {
  const tabButtons =
    document.querySelectorAll(".tab-button");

  tabButtons.forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        activateTab(
          button.dataset.tab
        );
      }
    );
  });
}


/* ==========================================================================
   12. Ward filter
   ========================================================================== */

function handleWardChange() {

  /*
   * The selected dataset changes here:
   *
   * All
   * ICU
   * HDU
   *
   * All KPI values are then re-rendered.
   */

  renderAllKpis();


  /*
   * Later we will add:
   *
   * renderCharts();
   * renderPrimaryDiagnosisTable();
   * renderDeathCaseTable();
   */
}


/* ==========================================================================
   13. Reset filters
   ========================================================================== */

function resetFilters() {

  const monthFilter =
    byId("month-filter");

  const wardFilter =
    byId("ward-filter");


  /* Reset reporting month */

  if (monthFilter) {
    monthFilter.value =
      dashboardData?.metadata?.reportingPeriod
      || "2026-08";
  }


  /* Reset ward */

  if (wardFilter) {
    wardFilter.value =
      dashboardData?.filters?.ward?.default
      || "All";
  }


  /* Re-render data */

  renderAllKpis();
}


/* ==========================================================================
   14. Set up filter listeners
   ========================================================================== */

function setupFilters() {

  const wardFilter =
    byId("ward-filter");

  const resetButton =
    byId("reset-filters");

  const searchInput =
    byId("death-case-search");

  const categoryFilter =
    byId("death-category-filter");

  const sortSelect =
    byId("death-sort");


  if (wardFilter) {
    wardFilter.addEventListener(
      "change",
      handleWardChange
    );
  }


  if (resetButton) {
    resetButton.addEventListener(
      "click",
      resetFilters
    );
  }

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      () => renderDeathCaseTable()
    );
  }

  if (categoryFilter) {
    categoryFilter.addEventListener(
      "change",
      () => renderDeathCaseTable()
    );
  }

  if (sortSelect) {
    sortSelect.addEventListener(
      "change",
      () => renderDeathCaseTable()
    );
  }
}


/* ==========================================================================
   15. Load JSON data
   ========================================================================== */

async function loadDashboardData() {

  try {

    showMessage(
      "Loading dashboard data...",
      "info"
    );


    const response =
      await fetch(
        DATA_URL,
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {
      throw new Error(
        `Failed to load dashboard data: HTTP ${response.status}`
      );
    }


    dashboardData =
      await response.json();


    /*
     * Basic validation
     */

    if (!dashboardData?.datasets?.All) {

      throw new Error(
        "The dashboard JSON does not contain datasets.All."
      );

    }


    /*
     * Render dashboard
     */

    renderMetadata();

    renderAllKpis();

    hideMessage();


    console.info(
      "ICU dashboard mock data loaded successfully."
    );

  }

  catch (error) {

    console.error(
      "Dashboard loading error:",
      error
    );


    showMessage(
      "Dashboard data could not be loaded. Please run the prototype through a local web server such as VS Code Live Server.",
      "error"
    );

  }

}


/* ==========================================================================
   16. App initialization
   ========================================================================== */

function initDashboard() {

  setupTabs();

  setupFilters();

  activateTab("overview");

  loadDashboardData();

}


/* ==========================================================================
   17. Start dashboard
   ========================================================================== */

document.addEventListener(
  "DOMContentLoaded",
  initDashboard
);