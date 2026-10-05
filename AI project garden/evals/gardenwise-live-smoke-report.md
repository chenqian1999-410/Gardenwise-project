# GardenWise Live Smoke-Test Report

Test target: `https://gardenwise-ai.vercel.app/project`  
Test date: 2026-09-19  
Scope: public UI and observable generated output; no source-code, server logs, network payload inspection, or controlled fixture injection.

## Outcome

**Conditional fail for release.** The primary happy path works and the core 50% coverage calculation is correct, but invalid negative areas are accepted and no-reference rendering is presented without an honesty boundary. Both violate the GardenWise evaluation contract.

## Executed checks

| Check | Result | Evidence |
|---|---|---|
| One planting-area input | PASS | Site step exposes one `PLANTING AREA / SQ FT` field and explicitly excludes buildings and hardscape. No separate Garden area field was observed. |
| Required site choices | PASS | Full sun, Partial shade, Shade, Low, and Medium controls are present. |
| Optional plan | PASS | Plan step accepts a site image, sketch, PDF, or architectural drawing and states that the built-in plant list needs no upload. The workflow can continue without a plan. |
| Canonical coverage: 792 sq ft | PASS | UI returned required mature cover of 396 sq ft. |
| Odd rounding: 101 sq ft | PASS | UI returned 51 sq ft. |
| Reject negative planting area | **FAIL / P0** | Entering `-40` displayed required cover `-20`; Continue remained available and advanced to Style. |
| Four-step workflow | PASS | 01 Plan, 02 Site, 03 Style, and 04 Report are present. Mobile uses a horizontal step strip. |
| Image-first style selection | PASS | Five illustrated style choices appear in a single selection view; Mediterranean selection updated the current direction. |
| Proposal coverage status | PASS | For 792 sq ft, report showed required 396 sq ft, palette 437 sq ft, ratio 110%, and PASS. |
| Proposal arithmetic | PASS | Visible schedule recomputes to 437 sq ft: `79 + 79 + 3×12 + 4×(3×13) + 4×12 + 3×13 = 437`. |
| Schedule fields | **FAIL / P0** | Botanical name, common name, type, quantity, mature cover, and purpose are shown, but each row lacks the required row-total coverage field (`quantity × mature cover`). |
| Spatial hierarchy | PASS | Generated palette contains trees, shrubs, and groundcovers rather than using a tree-only shortcut. |
| Maintenance filtering | NEEDS REVIEW | A `Low care` proposal selected persimmon plus apricot/peach/plum/nectarine trees. Confirm that the production database actually tags these as Low maintenance; the result appears maintenance-heavy. |
| Copy/data quality | NEEDS FIX | Common name `Japanesse persimmon` is misspelled. |
| Render-only design dialogue | PASS | Request for a quieter composition, warmer late-afternoon light, formal entry, and unchanged quantities produced a concise response and a rendering directive. The displayed schedule and 437 sq ft total did not change. |
| Directive visible for next render | PASS (UI) | The new directive appeared in the Rendering Direction field and was reflected in the generated scene. Server-side prompt concatenation was not inspectable. |
| No-plan rendering honesty | **FAIL** | With no plan, sketch, dimensions, or property photo, the app generated a specific house and site composition without explaining that exact property geometry could not be preserved or labeling the result conceptual. |
| Rendering composition | PASS as conceptual only | Generated image showed a complete roof, house, driveway, entry path, and planting areas without visible cropping, labels, zoning boxes, or UI overlays. Geometry fidelity cannot be assessed without a source plan. |
| Full-screen lightbox | PASS | Clicking the generated image opened a full-screen overlay with the whole landscape image visible and a close control. |

## Highest-priority fixes

### 1. Block invalid planting areas

Apply the same validation in the UI and recommendation endpoint:

- Require a finite number greater than zero.
- Disable Continue and proposal generation while invalid.
- Do not calculate or display negative/zero required coverage.
- Return a clear field-level error.

### 2. Add row-total coverage

Keep `MATURE COVER` as per-plant coverage and add a separate column:

```text
TOTAL COVER = QTY × MATURE COVER
```

The report total must be the sum of this column.

### 3. Label no-reference renders honestly

When no plan/image is supplied:

- Label the result `Conceptual rendering — not based on your property geometry`.
- Do not promise preservation of the user's roof, driveway, boundaries, or proportions.
- Invite the user to upload a plan, sketch, image, or PDF for geometry-faithful rendering.

### 4. Audit maintenance metadata

Verify that fruit trees used in a Low-care proposal are intentionally tagged Low maintenance. If not, filter them out or explain their pruning, fruit-drop, pest, and harvest burden before selection.

## Not verifiable from the public UI

These cases require source code, request interception, server logs, a controlled test database, or a supplied site-plan fixture:

- Exact plant eligibility against `fixtures/plant-database.json`.
- Exact five-key JSON returned by the text model.
- Server-side rendering prompt and no-crop constraint enforcement.
- Confirmation that `renderDirective` is appended server-side rather than only displayed in the UI.
- API-key/client-payload/log exposure checks.
- Geometry fidelity against an uploaded architectural plan.
- Desktop breakpoint and `prefers-reduced-motion` implementation.

## Recommended retest gate

Do not treat the public build as passing the GardenWise P0 gate until the negative-area and schedule-row-total failures are fixed. After that, rerun with a known architectural plan and controlled plant fixture, then inspect server-side request construction and secret handling.
