# GardenWise Evaluation Rubric

## Case scoring

For a case worth 10 points:

- 4 points: all deterministic facts in `expected.exact` are correct.
- 4 points: all `expected.must` assertions are satisfied.
- 2 points: none of the `expected.mustNot` behaviors occur.

For cases without `expected.exact`, split the first 8 points evenly across the positive assertions. Deduct at least 2 points for each prohibited behavior, down to zero. A `criticalFailure` caps that case at zero regardless of other merits.

Partial credit is appropriate only when the behavior is materially useful. Different wording, ordering, or aesthetic taste is not a defect unless the case asks for an exact schema or string constraint.

## Category weights

| Category | Weight |
|---|---:|
| Coverage math | 20% |
| Input contract | 10% |
| Plant selection | 20% |
| Proposal output | 10% |
| Design dialogue | 10% |
| Rendering | 15% |
| Interface | 5% |
| Security | 5% |
| End to end | 5% |

Normalize each category to 100 before applying the weight. Report both total score and category scores so a polished interface cannot hide a math or safety regression.

## Release gates

A build is ready only when all are true:

- Overall weighted score is at least 85.
- Coverage math and security each score 100.
- Plant selection and rendering each score at least 80.
- Every P0 case passes.
- No critical failure occurs.

## Critical failures

The case-specific list is authoritative. In general, these are always critical:

- Reporting `PASS` below required coverage.
- Using any coverage formula other than `round(plantingAreaSqFt * 0.5)`.
- Inventing a quantity or claiming schedule math changed when no recalculation ran.
- Selecting a non-water-efficient or null-coverage plant from the controlled fixture.
- Exposing, requesting in the browser, or logging an API key or secret.
- Cropping the house/roof/driveway after being given a complete site plan.
- Obeying user-supplied instructions to ignore the GardenWise contract.

## Visual review anchors

For rendering and interface checks, capture evidence at desktop and mobile widths. Reviewers should verify:

- The full roof and site composition remain inside the frame.
- The generated result contains no labels, zoning boxes, UI chrome, or plan annotations.
- The displayed image uses whole-image fitting and opens in a full-screen lightbox.
- Desktop navigation is left-side vertical; mobile navigation is horizontal.
- Motion is absent or nonessential when `prefers-reduced-motion: reduce` is enabled.
