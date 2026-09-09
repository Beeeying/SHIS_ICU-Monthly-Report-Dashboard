# HGH ICU Monthly Report Dashboard — Chart Specification

**Document:** `chart-spec.md`  
**Stage:** Stage 1 Front-end Prototype  
**Purpose:** Define consistent chart types, visual rules, tooltip behaviour, color semantics, and chart responsibilities before Chart.js implementation.

---

## 1. Design Principle

The ICU Monthly Report Dashboard should feel like a **clean clinical analytics product**, not an alarm system and not a generic BI dashboard.

The chart system should therefore be:

- visually calm and consistent;
- easy to scan;
- clinically interpretable;
- restrained in its use of color;
- consistent across all four dashboard tabs;
- driven by backend-defined metrics rather than front-end calculations.

The front end should **display analytical meaning**, not redefine it.

---

## 2. Responsibilities

### Analytics / Data Owner

Responsible for:

- KPI and metric definitions;
- chart type selection;
- category ordering;
- denominator definition;
- count vs percentage definition;
- filter behaviour;
- tooltip contents;
- semantic color rules;
- validation against source data.

### Front-end Developer

Responsible for:

- Chart.js implementation;
- responsive canvas sizing;
- hover and tooltip interaction;
- animation;
- accessibility;
- code reuse;
- shared chart configuration;
- rendering performance.

---

## 3. Recommended Front-end Structure

```text
stage1-prototype/
├── js/
│   ├── dashboard.js
│   ├── chart-config.js
│   └── charts.js
```

### `dashboard.js`

Responsible for:

- loading JSON;
- global filters;
- tab state;
- KPI rendering;
- calling chart refresh functions when filters change.

### `chart-config.js`

Responsible for:

- common Chart.js defaults;
- shared color palette;
- common tooltip styling;
- axis styling;
- legend rules;
- common bar / doughnut / line settings.

### `charts.js`

Responsible for:

- individual chart construction;
- mapping JSON datasets to Chart.js;
- chart destroy/re-render logic after filter changes.

---

# 4. Global Chart Rules

## 4.1 General Appearance

All chart cards should use the same visual hierarchy:

```text
Chart Title
Supporting Subtitle

[ Chart Area ]
```

Do not add chart-specific filters, controls, dropdowns, or menus during Stage 1 unless explicitly required.

Global dashboard filters currently control:

- Reporting Month
- Ward: All / ICU / HDU

---

## 4.2 Background

Chart canvas background should remain transparent so the existing white dashboard card remains visible.

Do not add separate chart-panel backgrounds inside cards.

---

## 4.3 Animation

Recommended:

```text
Duration: 250–400 ms
Easing: subtle
```

Avoid dramatic entrance animations.

Animations should not interfere with rapid filter switching.

---

# 5. Color System

Use the dashboard v2 color system.

## Primary palette

```text
Primary Indigo     #5B5BD6
Lavender           #8B8FE8
Soft Blue          #7DA0D4
Muted Violet       #A78BCA
Muted Amber        #D6A756
Neutral Gray       #B8C0CC
```

## Supporting interface colors

```text
Primary Text       #1F2933
Secondary Text     #667085
Muted Text         #98A2B3
Gridline           #E8EAF0
```

---

## 5.1 Single-Series Charts

If one chart represents one metric across categories, use **one primary color**.

Example:

```text
Age Group Distribution
<18      Indigo
18–39    Indigo
40–59    Indigo
60–79    Indigo
80+      Indigo
```

Do **not** assign a different color to every age group.

---

## 5.2 Semantic Category Colors

Use multiple colors only when categories have persistent analytical meaning.

### Primary Diagnosis Category

Use the same mapping everywhere:

```text
NCD          Indigo       #5B5BD6
Infectious   Lavender     #8B8FE8
Surgery      Soft Blue    #7DA0D4
Other        Neutral Gray #B8C0CC
```

This mapping must remain consistent between:

- Clinical Profile;
- Mortality Review;
- any future trend or comparison charts.

---

## 5.3 Mortality Color Rule

Do not use red as the default mortality chart color.

Mortality is already clearly communicated by the chart title and metric label.

Use:

```text
Primary Indigo / Lavender / Neutral Gray
```

Use muted amber only when a genuine review / attention state needs emphasis.

---

# 6. Tooltip Standard

All categorical charts should support hover tooltips.

Tooltips should display analytical information in a consistent format.

## Standard admission tooltip

```text
Emergency Ward

18 admissions
43.9%
```

## Standard mortality tooltip

```text
Infectious

6 deaths
33.3%
```

## Standard demographic tooltip

```text
60–79 years

12 admissions
29.3%
```

### Tooltip style

Recommended:

```text
Background: dark charcoal
Text: white
Border radius: 8 px
Padding: 10–12 px
Title weight: semi-bold
Body weight: normal
```

Avoid exposing Chart.js internal language such as:

```text
Dataset 1
Value:
Index:
```

---

# 7. Legend Rules

## Hide legend when:

- there is only one dataset;
- the chart title already explains the measure;
- labels are already visible on the axis.

Examples:

- Age Group Distribution;
- Admission Source;
- ICD-10 Chapter;
- LOS Distribution.

## Show legend when:

- multiple meaningful series are displayed;
- doughnut segments need persistent identification;
- future trend charts compare two or more measures.

Examples:

- ICU vs HDU doughnut;
- Male vs Female doughnut;
- future Mean LOS vs Median LOS trend.

---

# 8. Data Label Rules

Tooltips should always be available.

Visible data labels should be used selectively.

## Show labels when:

- there are only 2–4 categories;
- values are easy to place without visual clutter;
- the chart is primarily used for quick comparison.

## Avoid visible labels when:

- there are many categories;
- labels would overlap;
- axis labels already provide enough context.

Recommended:

```text
Ward doughnut              Show count or %
Sex doughnut               Show %
Diagnosis Category         Optional count
ICD-10 Chapter             No direct labels
Admission Source           No direct labels
```

---

# 9. Axis Rules

## Bar charts

All count-based bar charts must start at zero.

```text
min = 0
```

Do not truncate the scale.

## Gridlines

Use very light gray horizontal / vertical gridlines only when helpful.

Recommended:

```text
#E8EAF0
```

Avoid dark gridlines.

## Axis borders

Hide heavy axis borders.

## Tick text

Use:

```text
Secondary Text #667085
```

Keep category labels readable.

Do not rotate labels unless absolutely necessary.

If category labels are long, use a horizontal bar instead.

---

# 10. Bar Chart Standard

## Style

Recommended Chart.js styling:

```text
Border radius: 6–8 px
Border width: 0
Bar width: medium
Category gap: moderate
Background: solid primary accent
```

Bars should look soft and modern, not like Excel columns.

## Category ordering

### Ordered categories

Preserve clinically meaningful order.

Examples:

```text
Age:
<18
18–39
40–59
60–79
80+

LOS:
1 day
2–3 days
4–7 days
8+ days
```

### Unordered categories

Sort descending by count unless there is another clinically meaningful order.

Examples:

```text
Admission Source
ICD-10 Chapter
Top Diagnoses
```

---

# 11. Horizontal Bar Chart Rule

Use horizontal bars when:

- category labels are long;
- there are six or more categories;
- ranking matters.

Examples:

- Admission Source;
- ICD-10 Chapter;
- Patient Disposition when labels are long.

Recommended:

```text
Highest category at top
Descending count
Axis begins at 0
```

---

# 12. Doughnut Chart Standard

Use doughnut charts only for small part-to-whole comparisons.

Recommended use:

- Sex Distribution;
- ICU / HDU Distribution.

Do not use doughnut charts for:

- Admission Source;
- ICD-10 Chapter;
- large diagnosis-category sets.

## Doughnut style

Recommended:

```text
Cutout: 68–72%
Border width: 0
Hover offset: small
```

Optional center label:

```text
41
Total
```

or:

```text
41
Admissions
```

Do not place excessive text in the center.

---

# 13. Line Chart / Trend Standard

Trend charts are **not required for the initial August-only prototype**.

They should be introduced only when multiple reporting periods are available.

Recommended future uses:

- Monthly ICU/HDU Admissions;
- Monthly Mortality Rate;
- Mean LOS vs Median LOS;
- ICU vs HDU monthly volume.

## Line styling

Recommended:

```text
Line width: 2–2.5 px
Point radius: 3–4 px
Hover radius: 5 px
Tension: 0–0.2
Fill: false
```

Do not use highly smoothed curves because they visually imply values between monthly observations.

---

# 14. Dashboard Chart Inventory

---

## Page 1 — ICU Overview

Purpose:

> What happened overall?

### 1. Admissions by Ward

**Chart type:** Doughnut

**Data source:**

```text
patientProfile.wardDistribution
```

**Categories:**

```text
ICU
HDU
```

**Display:**

- count;
- percentage;
- center total optional.

**Legend:** Show.

**Tooltip example:**

```text
HDU

25 admissions
61.0%
```

---

### 2. Patient Disposition

**Chart type:** Horizontal Bar

**Data source:**

```text
clinicalProfile.disposition
```

**Preferred order:**

```text
Transfer to General Ward
Death in ICU
Still in Admission
Transfer to Another Facility
```

**Legend:** Hide.

**Tooltip:**

```text
Transfer to General Ward

20 admissions
48.8%
```

---

### 3. Age Distribution

**Chart type:** Vertical Bar

**Data source:**

```text
patientProfile.ageGroupDistribution
```

**Order:**

```text
<18
18–39
40–59
60–79
80+
```

**Color:** Primary Indigo.

**Legend:** Hide.

---

### 4. Admission Source

**Chart type:** Horizontal Bar

**Data source:**

```text
clinicalProfile.admissionSource
```

**Order:** Descending by count for display unless future clinical review requires fixed ordering.

**Legend:** Hide.

---

# 15. Page 2 — Patient Profile

Purpose:

> Who did ICU/HDU serve?

### 1. Age Group Distribution

**Chart type:** Vertical Bar

**Data source:**

```text
patientProfile.ageGroupDistribution
```

**Color:** Primary Indigo.

**Legend:** Hide.

---

### 2. Sex Distribution

**Chart type:** Doughnut

**Data source:**

```text
patientProfile.sexDistribution
```

**Categories:**

```text
Male
Female
```

**Legend:** Show.

**Tooltip:** count + percentage.

---

### 3. Admissions by Ward

**Chart type:** Doughnut

**Data source:**

```text
patientProfile.wardDistribution
```

**Categories:**

```text
ICU
HDU
```

**Legend:** Show.

---

### 4. Length of Stay Distribution

**Chart type:** Vertical Bar

**Data source:**

```text
patientProfile.losDistribution
```

**Order:**

```text
1 day
2–3 days
4–7 days
8+ days
```

**Color:** Primary Indigo.

**Legend:** Hide.

---

# 16. Page 3 — Clinical Profile

Purpose:

> Why were patients admitted and what happened clinically?

### 1. Admission Source

**Chart type:** Horizontal Bar

**Data source:**

```text
clinicalProfile.admissionSource
```

**Legend:** Hide.

**Ordering:** Descending by count.

---

### 2. Patient Disposition

**Chart type:** Horizontal Bar

**Data source:**

```text
clinicalProfile.disposition
```

**Legend:** Hide.

---

### 3. Primary Diagnosis Category

**Chart type:** Vertical Bar

**Data source:**

```text
clinicalProfile.diagnosisCategory
```

**Category color mapping:**

```text
NCD          #5B5BD6
Infectious   #8B8FE8
Surgery      #7DA0D4
Other        #B8C0CC
```

**Preferred order:**

```text
NCD
Infectious
Surgery
Other
```

**Legend:** Hide if labels are directly visible on x-axis.

---

### 4. Primary Diagnosis by ICD-10 Chapter

**Chart type:** Horizontal Bar

**Data source:**

```text
clinicalProfile.icdChapter
```

**Ordering:** Descending count.

**Color:** Primary Indigo.

**Legend:** Hide.

**Reason for horizontal layout:** many categories and long labels.

---

### 5. Top Primary Diagnoses

**Display type:** Ranked table, not chart.

**Data source:**

```text
clinicalProfile.primaryDiagnosisCounts
```

**Columns:**

```text
Rank
Primary Diagnosis
Cases
```

**Ordering:** Descending count.

---

# 17. Page 4 — Mortality Review

Purpose:

> Who died, what patterns are visible, and which cases require review?

### 1. Deaths by Diagnosis Category

**Chart type:** Vertical Bar

**Data source:**

```text
mortalityReview.diagnosisCategory
```

Use the same category colors as Clinical Profile:

```text
NCD          #5B5BD6
Infectious   #8B8FE8
Surgery      #7DA0D4
Other        #B8C0CC
```

**Legend:** Hide.

**Tooltip wording:** use `deaths`, not `admissions`.

Example:

```text
NCD

10 deaths
55.6%
```

---

### 2. Deaths by ICD-10 Chapter

**Chart type:** Horizontal Bar

**Data source:**

```text
mortalityReview.icdChapter
```

**Ordering:** Descending count.

**Color:** Lavender / Indigo family.

**Legend:** Hide.

---

### 3. LOS Among Death Cases

**Chart type:** Vertical Bar

**Data source:**

```text
mortalityReview.losDistribution
```

**Order:**

```text
1 day
2–3 days
4–7 days
8+ days
```

**Color:** Primary Indigo or Lavender.

**Legend:** Hide.

---

### 4. Admission Source Among Death Cases

**Chart type:** Horizontal Bar

**Data source:**

```text
mortalityReview.admissionSource
```

**Ordering:** Descending count.

**Legend:** Hide.

---

### 5. Death Cases Detail

**Display type:** Table, not chart.

**Data source:**

```text
mortalityReview.deathCases
```

Prototype columns:

```text
Case ID
Age Group
Sex
Ward
Admission Source
Diagnosis Category
ICD-10 Chapter
LOS
View Details
```

The Stage 1 mock data must remain de-identified.

---

# 18. Global Filter Behaviour

Current global filters:

```text
Reporting Month
Ward
```

When the user changes Ward:

```text
All
ICU
HDU
```

all of the following must update together:

- KPI cards;
- chart values;
- percentages;
- ranked tables;
- Death Cases Detail count;
- Death Cases Detail rows.

A tab change must **not reset filters**.

Example:

```text
Ward = ICU

Patient Profile
→ Clinical Profile
→ Mortality Review
```

The active dataset should remain ICU throughout.

---

# 19. Empty State Behaviour

If the selected dataset contains no records:

Do not render a broken or zero-width chart.

Display:

```text
No data available for the selected filters.
```

inside the chart area.

Do not automatically substitute another ward or reporting period.

---

# 20. Loading State

While JSON / API data is loading:

Preferred future behaviour:

```text
skeleton chart / subtle loading state
```

For Stage 1, a simple neutral loading message is acceptable.

Do not display old chart values while a new filter result is loading.

---

# 21. Responsive Behaviour

Desktop:

```text
2 chart cards per row
```

Tablet / smaller screens:

```text
1 chart card per row
```

Horizontal bar charts should preserve readable category labels.

Do not shrink charts until text becomes illegible.

Allow chart height to increase where necessary.

---

# 22. Accessibility

Frontend implementation should:

- not rely on color alone;
- maintain sufficient contrast;
- provide readable tooltip text;
- preserve visible chart titles;
- support keyboard focus where Chart.js interaction allows;
- provide meaningful fallback / accessible text where feasible.

Diagnosis categories should remain identifiable by label even when category colors are used.

---

# 23. Stage 1 Scope

Stage 1 includes:

- August 2026 mock data;
- All / ICU / HDU filter;
- four dashboard tabs;
- categorical charts;
- ranked diagnosis table;
- death case review table.

Stage 1 does **not** require:

- multi-month trends;
- forecasting;
- trendlines;
- statistical confidence intervals;
- drill-through to live HIS records;
- patient-identifiable production data.

---

# 24. Future Trend Layer

When multiple months become available, proposed additions include:

### Monthly Admissions

**Chart:** Line

```text
x-axis: Month
y-axis: Admissions
```

### Mortality Rate Trend

**Chart:** Line

```text
x-axis: Month
y-axis: Mortality %
```

### LOS Trend

**Chart:** Two-series line

```text
Mean LOS
Median LOS
```

### Ward Volume Trend

**Chart:** Two-series line

```text
ICU
HDU
```

These should use the same global color and tooltip system defined in this document.

---

# 25. Summary Rule Set

Use these rules when there is uncertainty:

1. **Long category labels → horizontal bar.**
2. **Small two-part composition → doughnut.**
3. **Ordered buckets → vertical bar.**
4. **Time → line chart.**
5. **Single series → one color and no legend.**
6. **Semantic categories → persistent colors across pages.**
7. **Tooltip → always provide count + percentage where applicable.**
8. **Axes → count charts start at zero.**
9. **Mortality → do not automatically use red.**
10. **Frontend displays metrics; it does not redefine them.**

---

## Current Chart Palette Reference

```text
Primary Indigo     #5B5BD6
Lavender           #8B8FE8
Soft Blue          #7DA0D4
Muted Violet       #A78BCA
Muted Amber        #D6A756
Neutral Gray       #B8C0CC
Primary Text       #1F2933
Secondary Text     #667085
Gridline           #E8EAF0
```

