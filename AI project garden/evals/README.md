# GardenWise Agent Evaluation Set

This directory contains a framework-neutral evaluation set for the GardenWise Landscape Studio agent. The set tests the contract in `skills/gardenwise-landscape-studio/SKILL.md`; it does not assume a particular agent SDK.

## Files

- `gardenwise-evalset.jsonl` — one self-contained evaluation case per line.
- `gardenwise-evalset.schema.json` — JSON Schema for a case.
- `fixtures/plant-database.json` — controlled plant database used where deterministic filtering and coverage are required.
- `rubric.md` — grading and release-gate rules.
- `validate_evalset.py` — dependency-free structural and fixture-reference validator.

## How to run

For cases with a `fixture`, make the fixture data available to the agent as its built-in database or inject it into the test harness as trusted context. Do not present it as a file the end user must upload.

Use `mode` as follows:

- `single_turn`: send `input.prompt` once, with `input.state` as trusted application state.
- `multi_turn`: initialize from `input.state`, then replay `input.turns` in order. The top-level prompt describes the scenario.
- `implementation_review`: inspect the produced UI, request payload, prompt, source, or application behavior named in the case.

The assertion language is intentionally plain. A runner may map `expected.exact` to programmatic equality and use an LLM or human grader for `must` and `mustNot`. Grade observable behavior, not specific prose.

## Important test semantics

- Coverage uses `round(plantingAreaSqFt * 0.5)`. In the supplied exact cases, values avoid language-specific ambiguous half rounding except for the explicit 101 sq ft test, whose required result is 51.
- Schedule total is the sum of every row's `quantity * matureCoverageSqFt`.
- A schedule is `PASS` only when its total is greater than or equal to required coverage.
- A plant with `waterEfficient: false` or unusable/null mature coverage is never eligible.
- `Low` maintenance requests accept only `Low`; `Medium` requests may use both `Low` and `Medium` plants.
- Large tree coverage may be included in the mathematical total, but the design must still provide a credible shrub/ground-plane layer. A tree-only or tree-dominated shortcut fails the qualitative hierarchy assertion.
- Rendering cases that mention an attachment assume a test harness can provide a simple architectural site-plan image. Exact pixel matching is not required; geometry preservation and no-crop behavior are judged visually.

## Recommended execution order

Run P0 cases first as a smoke/release gate, then P1, then P2. A useful CI split is:

1. Deterministic: coverage, filtering, row totals, JSON keys, and prompt-string checks.
2. Behavioral: design dialogue and end-to-end proposals.
3. Visual/manual: plan preservation, whole-image fitting, lightbox, responsive navigation, and reduced motion.

## Validation

Each line must be valid JSON and conform to `gardenwise-evalset.schema.json`. Run the included dependency-free structural check with:

```sh
python3 evals/validate_evalset.py
```
