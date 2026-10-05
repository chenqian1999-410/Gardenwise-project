# GardenWise Fix Verification

Source reviewed and changed at: `/Users/ellenqian/Desktop/projects/AI project garden`  
Verification date: 2026-09-19

## Fixed defects

| Defect | Fix | Verification |
|---|---|---|
| Negative/zero/non-finite planting area accepted | Added shared invariant checks in UI navigation, proposal generation, API boundary, and deterministic recommendation logic | `-40` now shows an inline error, required cover becomes `—`, Continue is disabled, direct Style navigation is blocked, and the API returns HTTP 400 |
| Row-total coverage missing | Added `Total cover` column sourced from deterministic `total_coverage` | Every tested row equals `quantity × mature_coverage`; schedule row sum equals reported total |
| Style and sun were scoring hints rather than eligibility filters | Converted style, sun, usable coverage, and Low-maintenance rules into hard filters before scoring | All returned 792 sq ft Mediterranean/Full sun rows match both tags and have positive coverage |
| Low-care palette included obvious fruit/edible trees | Added conservative maintenance classification fallback until source data gains explicit `maintenance_level` | Final Low-care regression contains no matched edible/fruit rows |
| Two oversized trees could dominate the palette | Reduced structural tree selection to at most one and retained shrub/ground-plane layers | Final regression includes shrubs, groundcovers, ornamental grasses, and perennials; total passes without tree coverage |
| No-plan render implied exact property fidelity | Added separate `source-plan` and `conceptual` modes in UI prompt construction and server prompt enforcement | UI labels no-plan output conceptual; server explicitly forbids property-specific claims without an image |
| Plant name typo | Changed `Japanesse persimmon` to `Japanese persimmon` | Source search confirms corrected value |

## Numeric regression results

```text
plantingArea                 792 sq ft
requiredCoverage            396 sq ft
totalCoverage               429 sq ft
coverage ratio              108.3%
PASS                         true
row sum                      429 sq ft
invalid row calculations    0
matched fruit/edible rows   0
schedule rows               12
```

Invalid request regression:

```text
plantingArea   -40
HTTP status    400
API result     Planting area must be a finite number greater than 0 sq ft.
```

## Updated score

The 19 observable smoke-test checks now pass. Source inspection additionally verifies server prompt enforcement, design-directive propagation, server-side secret use, reduced-motion handling, and filtering logic. Geometry fidelity against a real uploaded architectural plan remains the only unexecuted visual check.

```text
observable checks passed     19 / 19 = 100%
verified/in-scope checks     25 / 26 = 96.2%
remaining visual check        1 / 26 = 3.8%
provisional readiness score          96.2 / 100
release status                       PASS WITH ONE VISUAL RETEST
```

## Build verification

`npm run build` completed successfully with all 11 Next.js routes generated or registered.

## Remaining recommended improvement

The production plant source does not contain an explicit maintenance field. The current fallback safely classifies obvious fruit/edible plants as Medium, but horticultural maintenance should eventually be curated per plant in `src/data/plants.json`. After adding those values, remove or narrow the name-based fallback and rerun Low/Medium palette tests.
