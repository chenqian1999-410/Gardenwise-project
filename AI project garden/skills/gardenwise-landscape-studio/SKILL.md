---
name: gardenwise-landscape-studio
description: Build or improve an AI-assisted water-efficient residential landscape workflow for California Bay Area USDA Zone 10a projects. Use when a task involves qualified plant data, planting-area coverage calculations, generated plant schedules, iterative AI design dialogue, or plan-to-photorealistic landscape rendering.
---

# GardenWise Landscape Studio

## Purpose

Turn a professional low-water plant list and a residential garden plan into a usable planting proposal and a photorealistic rendering workflow. The experience is for California Bay Area Zone 10a residential gardens and should feel like a landscape design studio, not a generic plant search tool.

## Required Inputs

- A built-in structured plant database. Do not require the end user to upload a plant PDF when a source plant list has already been parsed.
- One user-facing area field: `plantingArea` in square feet. This includes only plantable ground, never the house, driveway, patio, or other hardscape.
- Sun condition: `Full sun`, `Partial shade`, or `Shade`.
- Maintenance preference: `Low` or `Medium`.
- Garden style selection.
- Optional site drawing, sketch, plan image, or PDF. An image drawing can be used as geometry reference for rendering.

## Coverage Logic

Use this invariant everywhere in the UI, API, reports, and AI prompts:

```text
requiredCoverageSqFt = round(plantingAreaSqFt * 0.5)
```

- Never display two overlapping area inputs such as `Garden area` and `Planting area`.
- Plant schedule coverage is the sum of `quantity * mature_coverage` for each selected row.
- Report `PASS` only when total mature coverage is at least the required coverage.
- If coverage is short, increase suitable groundcover/shrub quantities or recommend a replacement palette. Do not disguise a coverage shortfall with prose.

## Plant Selection Workflow

1. Filter plants by water-efficient eligibility, usable mature coverage, selected sun condition, and garden style tag.
2. Form a spatial hierarchy: tree or tall structural layer, shrubs, groundcovers, ornamental grasses, and succulents/perennials where suitable.
3. Balance plant quantities to meet coverage without overusing oversized tree coverage as a substitute for planted ground plane.
4. Return a schedule with botanical name, common name, type, quantity, mature coverage, total coverage, and design purpose.
5. Keep quantity and coverage math deterministic in application code. Use an LLM to articulate design concept, seasonal behavior, care guidance, and spatial direction, not to overwrite correct calculations casually.

## Text Proposal Model

Default to a low-cost text model such as `deepseek/deepseek-v4-flash` when available through OpenRouter.

Use this system prompt baseline:

```text
You are GardenWise AI, a professional Bay Area Zone 10a landscape design assistant. Return concise JSON only. Preserve plant schedule quantities and coverage math unless there is a clear issue.
```

The model receives the user input and deterministic proposal. Require exactly this response shape:

```json
{
  "concept": "",
  "styleExplanation": "",
  "seasonalCharacteristics": "",
  "maintenanceSuggestions": "",
  "spatialGuidance": []
}
```

## Rendering Model Workflow

Use a capable image model through OpenRouter, such as `google/gemini-3.1-flash-image`; offer a quality upgrade like `google/gemini-3-pro-image` when available.

Pass the uploaded plan image alongside this prompt content:

```text
Use the uploaded architectural garden plan as the exact source drawing for geometry.
Create one polished photorealistic landscape rendering for a [STYLE].
Preserve the full residence footprint and complete visible roof, garage, driveway, walkways, hardscape boundaries, side yards, and planting-area proportions from the plan.
Render the selected low-water plants as realistic mature planting masses: [QUANTIFIED PLANT LIST].
The complete building roof must remain visible and fully inside the image frame. Show the entire property composition without cropping the roof, house, driveway, or main planting areas.
No text labels, zoning boxes, UI, diagrams, screenshots, or overlays.
Camera: elevated 3/4 architectural visualization showing the full plan relationship, professional landscape portfolio quality, natural daylight.
[OPTIONAL APPROVED DESIGN ADJUSTMENTS]
```

Apply the same no-crop and complete-roof constraints server-side, even if the frontend already builds them. The generated image should be displayed whole using `object-contain`; clicking it should open a full-screen lightbox.

## Design Dialogue

Provide a compact, always-available design dialogue in the results workspace.

- Let users request changes such as quieter planting, fewer trees, stronger material contrast, warmer light, or a more formal entry.
- Send current style, planting area, sun, maintenance, coverage, chosen plants, and prior dialogue to the text model.
- Ask the model for JSON with a short human response and a concise `renderDirective`.
- Append the directive automatically to the next image rendering prompt.
- Do not claim plant quantities or coverage changed unless a new proposal calculation has actually run.

Suggested design-dialogue system prompt:

```text
You are GardenWise AI, a thoughtful Bay Area Zone 10a landscape design collaborator. Turn a user's requested design change into an accurate, concise render direction. Never claim that coverage math or plant quantities changed unless the request explicitly calls for a new proposal. Return JSON only.
```

## Interface Direction

- Use a calm editorial landscape-studio aesthetic: paper surfaces, low-saturation olive/sage accents, soft aged neutrals, generous whitespace, and a serif display face.
- Avoid dense dashboard cards, hard modern gradients, and loud saturated green.
- Present the workflow as four focused steps: `01 Plan`, `02 Site`, `03 Style`, `04 Report`.
- Keep an accessible left-side vertical step navigator on larger screens and a horizontal variant on mobile.
- Show all style images in a single visual window; style selection should be image-first.
- Keep functional controls clear. Tooltips and labels should make every important action understandable.
- Any generated decorative visual used by the application must be saved inside the project, never referenced from a temporary generation directory.
- Use motion only as a quiet background layer; honor `prefers-reduced-motion`.

## Security

- Keep OpenRouter credentials server-side in environment variables such as `OPENROUTER_API_KEY`.
- Never render keys or token fields in the user interface.
- Never include keys in client request bodies, logged prompt data, source code, or deployment notes.

## Verification Checklist

Before finishing:

1. Run a production build.
2. Test a 792 sq ft planting area and verify required coverage is 396 sq ft.
3. Verify there is no remaining `Garden area` or duplicate `Planting area` input in the flow.
4. Verify the recommendation endpoint respects the single planting-area calculation.
5. Verify the image prompt includes exact geometry preservation, full visible roof, and no-crop constraints.
6. Verify the design dialogue returns a `renderDirective` and that it appears in the next render request.
7. Verify image display opens a full-size lightbox and uses complete-image fitting rather than cropping.
8. Do not expose secret values during any test or deployment.

