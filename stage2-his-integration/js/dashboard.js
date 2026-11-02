"use strict";



/* ==========================================================================

   HGH ICU Monthly Report Dashboard

   Stage 1 — dashboard.js



   Current responsibilities:

   1. Load multi-month ICU JSON data

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



const DATA_URL = "./data/icu_monthly_data_aug_sep_2026.json";



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



function getSelectedMonth() {

  const monthFilter = byId("month-filter");



  if (!monthFilter) {

    return (

      dashboardData?.filters?.month?.default

      || dashboardData?.metadata?.defaultReportingPeriod

      || "2026-09"

    );

  }



  return monthFilter.value;

}





function getActivePeriod() {

  const month = getSelectedMonth();



  const period = dashboardData?.periods?.[month];



  if (!period) {

    console.warn(

      `Reporting period not found: ${month}`

    );



    return null;

  }



  return period;

}





function renderMetadata() {

  const period = getActivePeriod();



  if (!period?.metadata) {

    return;

  }



  setText(

    "cohort-label",

    period.metadata.cohortLabel

  );



  setText(

    "data-through",

    formatDate(period.metadata.dataThrough)

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

  const month = getSelectedMonth();



  const ward = getSelectedWard();



  const period = dashboardData?.periods?.[month];



  if (!period?.datasets?.[ward]) {

    console.warn(

      `Dataset not found for reporting period ${month} and ward ${ward}`

    );



    return null;

  }



  return period.datasets[ward];

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

   10. Death Case Detail Table

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



  const cases =

    dataset?.mortalityReview?.deathCases || [];



  const searchInput =

    byId("death-case-search");



  const categoryFilter =

    byId("death-category-filter");



  const sortSelect =

    byId("death-sort");



  const searchTerm =

    (searchInput?.value || "")

      .trim()

      .toLowerCase();



  const categoryValue =

    categoryFilter?.value || "All";



  const sortValue =

    sortSelect?.value || "caseId";



  let filteredCases = [...cases];





  /* ----------------------------------------------------------

     Search filter

     ---------------------------------------------------------- */



  if (searchTerm) {

    filteredCases =

      filteredCases.filter(

        (item) =>

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





  /* ----------------------------------------------------------

     Diagnosis category filter

     ---------------------------------------------------------- */



  if (categoryValue !== "All") {

    filteredCases =

      filteredCases.filter(

        (item) =>

          item.diagnosisCategory === categoryValue

      );

  }





  /* ----------------------------------------------------------

     Sorting

     ---------------------------------------------------------- */



  if (sortValue === "los-desc") {

    filteredCases.sort(

      (a, b) =>

        Number(b.losDays) -

        Number(a.losDays)

    );

  }

  else if (sortValue === "los-asc") {

    filteredCases.sort(

      (a, b) =>

        Number(a.losDays) -

        Number(b.losDays)

    );

  }

  else {

    filteredCases.sort(

      (a, b) =>

        String(a.caseId)

          .localeCompare(

            String(b.caseId)

          )

    );

  }





  /* ----------------------------------------------------------

     Empty table state

     ---------------------------------------------------------- */



  if (!filteredCases.length) {

    tbody.innerHTML = `

      <tr>

        <td colspan="9">

          No death cases match the selected filters.

        </td>

      </tr>

    `;



    setText(

      "death-case-count",

      "0 cases"

    );



    return;

  }





  /* ----------------------------------------------------------

     Render table rows

     ---------------------------------------------------------- */



  tbody.innerHTML =

    filteredCases

      .map(

        (item) => `

          <tr>

            <td>

              ${item.caseId || "—"}

            </td>

            <td>

              ${item.ageGroup || "—"}

            </td>

            <td>

              ${item.sex || "—"}

            </td>

            <td>

              ${item.ward || "—"}

            </td>

            <td>

              ${item.admissionSource || "—"}

            </td>

            <td>

              ${item.diagnosisCategory || "—"}

            </td>

            <td>

              ${item.icdChapter || "—"}

            </td>

            <td>

              ${item.losDays ?? "—"}

            </td>

            <td>

              <button

                type="button"

                class="table-action-button"

                aria-label="View case ${item.caseId || "details"}"

              >

                View

              </button>

            </td>

          </tr>

        `

      )

      .join("");





  setText(

    "death-case-count",

    `${filteredCases.length} ${

      filteredCases.length === 1

        ? "case"

        : "cases"

    }`

  );

}





/* ==========================================================================

   11. Render complete dashboard dataset

   ========================================================================== */



function renderAllKpis() {

  const dataset =

    getActiveDataset();



  if (!dataset) {

    showMessage(

      "Unable to find data for the selected reporting month and ward.",

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

  }

  else {

    console.warn(

      "ICUCharts is not available. Check that charts.js is loaded before dashboard.js."

    );

  }

}





/* ==========================================================================

   12. Dashboard tabs

   ========================================================================== */



function activateTab(tabId) {

  const tabButtons =

    document.querySelectorAll(

      ".tab-button"

    );



  const pages =

    document.querySelectorAll(

      ".dashboard-page"

    );





  /* ----------------------------------------------------------

     Update tab buttons

     ---------------------------------------------------------- */



  tabButtons.forEach(

    (button) => {

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

    }

  );





  /* ----------------------------------------------------------

     Update page visibility

     ---------------------------------------------------------- */



  pages.forEach(

    (page) => {

      const isActive =

        page.id === tabId;



      page.classList.toggle(

        "active-page",

        isActive

      );



      page.hidden =

        !isActive;

    }

  );

}





function setupTabs() {

  const tabButtons =

    document.querySelectorAll(

      ".tab-button"

    );



  tabButtons.forEach(

    (button) => {

      button.addEventListener(

        "click",

        () => {

          activateTab(

            button.dataset.tab

          );

        }

      );

    }

  );

}





/* ==========================================================================

   13. Reporting month filter

   ========================================================================== */



function handleMonthChange() {

  /*

   * Month changes:

   *

   * 2026-08

   * 2026-09

   *

   * Metadata, KPI values, charts, and death-case

   * details are all re-rendered from the newly

   * selected reporting period.

   */



  renderMetadata();



  renderAllKpis();

}





/* ==========================================================================

   14. Ward filter

   ========================================================================== */



function handleWardChange() {

  /*

   * Ward changes:

   *

   * All

   * ICU

   * HDU

   *

   * The active dataset remains inside the

   * currently selected reporting period.

   */



  renderAllKpis();

}





/* ==========================================================================

   15. Reset filters

   ========================================================================== */



function resetFilters() {

  const monthFilter =

    byId("month-filter");



  const wardFilter =

    byId("ward-filter");





  /* ----------------------------------------------------------

     Reset reporting month

     ---------------------------------------------------------- */



  if (monthFilter) {

    monthFilter.value =

      dashboardData

        ?.filters

        ?.month

        ?.default

      || dashboardData

        ?.metadata

        ?.defaultReportingPeriod

      || "2026-09";

  }





  /* ----------------------------------------------------------

     Reset ward

     ---------------------------------------------------------- */



  if (wardFilter) {

    wardFilter.value =

      dashboardData

        ?.filters

        ?.ward

        ?.default

      || "All";

  }





  /* ----------------------------------------------------------

     Reset death case table controls

     ---------------------------------------------------------- */



  const searchInput =

    byId("death-case-search");



  const categoryFilter =

    byId("death-category-filter");



  const sortSelect =

    byId("death-sort");



  if (searchInput) {

    searchInput.value = "";

  }



  if (categoryFilter) {

    categoryFilter.value = "All";

  }



  if (sortSelect) {

    sortSelect.value = "caseId";

  }





  /* ----------------------------------------------------------

     Re-render metadata + dashboard

     ---------------------------------------------------------- */



  renderMetadata();



  renderAllKpis();

}





/* ==========================================================================

   16. Set up filter listeners

   ========================================================================== */



function setupFilters() {

  const monthFilter =

    byId("month-filter");



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





  /* ----------------------------------------------------------

     Reporting month

     ---------------------------------------------------------- */



  if (monthFilter) {

    monthFilter.addEventListener(

      "change",

      handleMonthChange

    );

  }





  /* ----------------------------------------------------------

     Ward

     ---------------------------------------------------------- */



  if (wardFilter) {

    wardFilter.addEventListener(

      "change",

      handleWardChange

    );

  }





  /* ----------------------------------------------------------

     Reset

     ---------------------------------------------------------- */



  if (resetButton) {

    resetButton.addEventListener(

      "click",

      resetFilters

    );

  }





  /* ----------------------------------------------------------

     Death case table search

     ---------------------------------------------------------- */



  if (searchInput) {

    searchInput.addEventListener(

      "input",

      () =>

        renderDeathCaseTable()

    );

  }





  /* ----------------------------------------------------------

     Death case category filter

     ---------------------------------------------------------- */



  if (categoryFilter) {

    categoryFilter.addEventListener(

      "change",

      () =>

        renderDeathCaseTable()

    );

  }





  /* ----------------------------------------------------------

     Death case sort

     ---------------------------------------------------------- */



  if (sortSelect) {

    sortSelect.addEventListener(

      "change",

      () =>

        renderDeathCaseTable()

    );

  }

}





/* ==========================================================================

   17. Populate reporting month dropdown

   ========================================================================== */



function populateMonthFilter() {

  const monthFilter =

    byId("month-filter");



  if (!monthFilter) {

    return;

  }





  /* ----------------------------------------------------------

     Read reporting month options from JSON

     ---------------------------------------------------------- */



  const options =

    dashboardData

      ?.filters

      ?.month

      ?.options

    || [];





  /* ----------------------------------------------------------

     Rebuild dropdown dynamically

     ---------------------------------------------------------- */



  if (

    Array.isArray(options)

    && options.length

  ) {

    monthFilter.innerHTML =

      options

        .map(

          (item) => {

            const value =

              typeof item === "string"

                ? item

                : item.value;



            const label =

              typeof item === "string"

                ? item

                : item.label;



            return (

              `<option value="${value}">`

              + `${label}`

              + `</option>`

            );

          }

        )

        .join("");

  }





  /* ----------------------------------------------------------

     Determine default reporting month

     ---------------------------------------------------------- */



  const defaultMonth =

    dashboardData

      ?.filters

      ?.month

      ?.default

    || dashboardData

      ?.metadata

      ?.defaultReportingPeriod

    || dashboardData

      ?.metadata

      ?.availableReportingPeriods

      ?.[0]

    || Object.keys(

      dashboardData?.periods || {}

    )[0]

    || "";





  if (defaultMonth) {

    monthFilter.value =

      defaultMonth;

  }

}





/* ==========================================================================

   18. Validate loaded multi-month JSON

   ========================================================================== */



function validateDashboardData(data) {

  if (!data) {

    throw new Error(

      "Dashboard JSON is empty."

    );

  }





  /* ----------------------------------------------------------

     periods object

     ---------------------------------------------------------- */



  if (!data.periods) {

    throw new Error(

      "The dashboard JSON does not contain a periods object."

    );

  }





  const reportingPeriods =

    Object.keys(

      data.periods

    );





  if (!reportingPeriods.length) {

    throw new Error(

      "The dashboard JSON does not contain any reporting periods."

    );

  }





  /* ----------------------------------------------------------

     Validate every reporting period

     ---------------------------------------------------------- */



  reportingPeriods.forEach(

    (periodKey) => {

      const period =

        data.periods[periodKey];



      if (!period) {

        throw new Error(

          `Reporting period ${periodKey} is empty.`

        );

      }



      if (!period.metadata) {

        throw new Error(

          `Reporting period ${periodKey} does not contain metadata.`

        );

      }



      if (!period.datasets) {

        throw new Error(

          `Reporting period ${periodKey} does not contain datasets.`

        );

      }



      if (!period.datasets.All) {

        throw new Error(

          `The dashboard JSON does not contain periods.${periodKey}.datasets.All.`

        );

      }



      if (!period.datasets.ICU) {

        console.warn(

          `The dashboard JSON does not contain periods.${periodKey}.datasets.ICU.`

        );

      }



      if (!period.datasets.HDU) {

        console.warn(

          `The dashboard JSON does not contain periods.${periodKey}.datasets.HDU.`

        );

      }

    }

  );

}





/* ==========================================================================

   19. Load JSON data

   ========================================================================== */



async function loadDashboardData() {

  try {

    showMessage(

      "Loading dashboard data...",

      "info"

    );





    /* ----------------------------------------------------------

       Fetch JSON

       ---------------------------------------------------------- */



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





    /* ----------------------------------------------------------

       Validate multi-month structure

       ---------------------------------------------------------- */



    validateDashboardData(

      dashboardData

    );





    /* ----------------------------------------------------------

       Populate month selector

       ---------------------------------------------------------- */



    populateMonthFilter();





    /* ----------------------------------------------------------

       Render dashboard

       ---------------------------------------------------------- */



    renderMetadata();



    renderAllKpis();



    hideMessage();





    console.info(

      "ICU dashboard multi-month data loaded successfully."

    );

  }

  catch (error) {

    console.error(

      "Dashboard loading error:",

      error

    );





    showMessage(

      "Dashboard data could not be loaded. Check the multi-month JSON path and run the dashboard through a local web server such as VS Code Live Server.",

      "error"

    );

  }

}





/* ==========================================================================

   20. App initialization

   ========================================================================== */



function initDashboard() {

  /* ----------------------------------------------------------

     Set up UI controls

     ---------------------------------------------------------- */



  setupTabs();



  setupFilters();





  /* ----------------------------------------------------------

     Initial tab

     ---------------------------------------------------------- */



  activateTab(

    "overview"

  );





  /* ----------------------------------------------------------

     Load dashboard data

     ---------------------------------------------------------- */



  loadDashboardData();

}





/* ==========================================================================

   21. Start dashboard

   ========================================================================== */



document.addEventListener(

  "DOMContentLoaded",

  initDashboard

);