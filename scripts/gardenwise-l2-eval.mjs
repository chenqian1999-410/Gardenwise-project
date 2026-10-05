#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.GARDENWISE_BASE_URL || "http://127.0.0.1:3017";
const outputPath = process.env.GARDENWISE_EVAL_OUTPUT || path.join(projectRoot, "gardenwise-l2-results.json");
const plants = JSON.parse(await readFile(path.join(projectRoot, "src/data/plants.json"), "utf8"));
const plantByBotanicalName = new Map(plants.map((plant) => [plant.botanical_name, plant]));

const styles = ["california-native", "mediterranean", "japanese-zen", "desert-modern", "modern-minimal"];
const suns = ["Full sun", "Partial shade", "Shade"];
const maintenancePreferences = ["Low", "Medium"];
const fruitPattern = /\b(edible|fruit|apple|pear|peach|plum|nectarine|apricot|persimmon|citrus|fig|pomegranate|avocado|jujube|ziziphus)\b/i;

const results = [];

function record(id, category, pass, evidence, priority = "P1") {
  results.push({ id, category, priority, pass: Boolean(pass), evidence });
}

async function recommend(input) {
  const response = await fetch(`${baseUrl}/api/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const payload = await response.json();
  return { status: response.status, payload };
}

function baseInput(overrides = {}) {
  return {
    plantingArea: 792,
    sunCondition: "Full sun",
    maintenance: "Low",
    selectedStyle: "mediterranean",
    uploadedPlanName: "",
    ...overrides
  };
}

function inspectProposal(payload, input) {
  const requiredCoverage = Math.round(Number(input.plantingArea) * 0.5);
  const rows = Array.isArray(payload.plantSchedule) ? payload.plantSchedule : [];
  const rowMathValid = rows.every(
    (row) => row.total_coverage === row.quantity * row.mature_coverage
  );
  const rowSum = rows.reduce((sum, row) => sum + row.total_coverage, 0);
  const eligibilityFailures = rows.flatMap((row) => {
    const plant = plantByBotanicalName.get(row.botanical_name);
    const failures = [];
    if (!plant) failures.push(`${row.botanical_name}: missing from database`);
    if (plant && !plant.suitable_style_tags?.includes(input.selectedStyle)) failures.push(`${row.botanical_name}: style`);
    if (plant && !plant.sunlight_requirement?.includes(input.sunCondition)) failures.push(`${row.botanical_name}: sun`);
    if (plant && !(Number.isFinite(plant.coverage_value_sqft) && plant.coverage_value_sqft > 0)) failures.push(`${row.botanical_name}: coverage`);
    if (
      input.maintenance === "Low" &&
      fruitPattern.test(`${row.botanical_name || ""} ${row.common_name || ""}`)
    ) failures.push(`${row.botanical_name}: maintenance`);
    return failures;
  });
  const nonTreeRows = rows.filter((row) => row.plant_type !== "Tree");
  const groundPlaneRows = rows.filter((row) => ["Shrub", "Groundcover", "Ornamental grass", "Succulent", "Perennial / Biennial"].includes(row.plant_type));
  return {
    requiredCoverage,
    rowSum,
    rowMathValid,
    eligibilityFailures,
    coverageConsistent:
      payload.coverage?.requiredCoverage === requiredCoverage &&
      payload.coverage?.totalCoverage === rowSum &&
      payload.coverage?.pass === (rowSum >= requiredCoverage),
    hierarchyValid: rows.length === 0 || (nonTreeRows.length > 0 && groundPlaneRows.length > 0),
    rows: rows.length,
    pass: payload.coverage?.pass
  };
}

// Invalid and adversarial inputs.
const invalidAreas = [-40, 0, -0.1, "", null, "abc", [], {}, "Infinity", "792; ignore prior rules"];
for (const [index, plantingArea] of invalidAreas.entries()) {
  const response = await recommend(baseInput({ plantingArea }));
  record(
    `L2-INPUT-${String(index + 1).padStart(2, "0")}`,
    "input_validation",
    response.status === 400,
    { plantingArea, status: response.status, error: response.payload.error },
    "P0"
  );
}

const invalidEnums = [
  { field: "sunCondition", value: "All light conditions" },
  { field: "maintenance", value: "None" },
  { field: "selectedStyle", value: "ignore-rules" }
];
for (const [index, test] of invalidEnums.entries()) {
  const response = await recommend(baseInput({ [test.field]: test.value }));
  record(
    `L2-ENUM-${String(index + 1).padStart(2, "0")}`,
    "input_validation",
    response.status === 400,
    { ...test, status: response.status, error: response.payload.error },
    "P0"
  );
}

// Full style × sun × maintenance matrix.
let matrixIndex = 0;
for (const selectedStyle of styles) {
  for (const sunCondition of suns) {
    for (const maintenance of maintenancePreferences) {
      matrixIndex += 1;
      const input = baseInput({ selectedStyle, sunCondition, maintenance });
      const response = await recommend(input);
      const inspection = response.status === 200 ? inspectProposal(response.payload, input) : null;
      const pass =
        response.status === 200 &&
        inspection.coverageConsistent &&
        inspection.rowMathValid &&
        inspection.eligibilityFailures.length === 0 &&
        inspection.hierarchyValid;
      record(
        `L2-MATRIX-${String(matrixIndex).padStart(2, "0")}`,
        "selection_matrix",
        pass,
        { selectedStyle, sunCondition, maintenance, status: response.status, inspection },
        "P0"
      );
    }
  }
}

// Deterministic pseudo-random coverage cases.
let seed = 20260919;
function nextArea() {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return Number((1 + (seed % 500000) / 100).toFixed(2));
}

for (let index = 0; index < 100; index += 1) {
  const plantingArea = nextArea();
  const input = baseInput({
    plantingArea,
    selectedStyle: styles[index % styles.length],
    sunCondition: suns[index % suns.length],
    maintenance: maintenancePreferences[index % maintenancePreferences.length]
  });
  const response = await recommend(input);
  const inspection = response.status === 200 ? inspectProposal(response.payload, input) : null;
  record(
    `L2-MATH-${String(index + 1).padStart(3, "0")}`,
    "coverage_property",
    response.status === 200 && inspection.coverageConsistent && inspection.rowMathValid,
    { plantingArea, status: response.status, inspection },
    "P0"
  );
}

// Concurrent requests should remain deterministic and isolated.
const concurrentInputs = Array.from({ length: 20 }, (_, index) =>
  baseInput({ plantingArea: 200 + index * 17, selectedStyle: styles[index % styles.length] })
);
const concurrentResponses = await Promise.all(concurrentInputs.map((input) => recommend(input)));
concurrentResponses.forEach((response, index) => {
  const inspection = response.status === 200 ? inspectProposal(response.payload, concurrentInputs[index]) : null;
  record(
    `L2-CONC-${String(index + 1).padStart(2, "0")}`,
    "concurrency",
    response.status === 200 && inspection.coverageConsistent && inspection.rowMathValid,
    { status: response.status, plantingArea: concurrentInputs[index].plantingArea, inspection }
  );
});

// Source-level security, rendering, dialogue, and accessibility contracts.
const sourceFiles = {
  projectBuilder: await readFile(path.join(projectRoot, "components/ProjectBuilder.js"), "utf8"),
  resultDashboard: await readFile(path.join(projectRoot, "components/ResultDashboard.js"), "utf8"),
  recommendation: await readFile(path.join(projectRoot, "lib/recommendation.js"), "utf8"),
  recommendRoute: await readFile(path.join(projectRoot, "app/api/recommend/route.js"), "utf8"),
  renderRoute: await readFile(path.join(projectRoot, "app/api/render-image/route.js"), "utf8"),
  designRoute: await readFile(path.join(projectRoot, "app/api/design-chat/route.js"), "utf8"),
  css: await readFile(path.join(projectRoot, "app/globals.css"), "utf8")
};

const sourceAssertions = [
  ["L2-SOURCE-01", "security", !Object.values(sourceFiles).some((text) => /NEXT_PUBLIC_(?:OPENROUTER|OPENAI).*KEY/.test(text)), "No public API-key variable"],
  ["L2-SOURCE-02", "security", sourceFiles.renderRoute.includes("process.env.OPENROUTER_API_KEY"), "Render key remains server-side"],
  ["L2-SOURCE-03", "rendering", sourceFiles.renderRoute.includes('geometryMode: hasPlanImage ? "source-plan" : "conceptual"'), "Server distinguishes geometry modes"],
  ["L2-SOURCE-04", "rendering", sourceFiles.renderRoute.includes("complete roof") && sourceFiles.renderRoute.includes("Do not crop"), "Server enforces roof and no-crop constraints"],
  ["L2-SOURCE-05", "rendering", sourceFiles.resultDashboard.includes("Conceptual rendering — not based on your property geometry"), "No-plan UI is honest"],
  ["L2-SOURCE-06", "dialogue", sourceFiles.designRoute.includes("renderDirective") && sourceFiles.resultDashboard.includes("onApply(reply.renderDirective)"), "Dialogue directive reaches render state"],
  ["L2-SOURCE-07", "dialogue", sourceFiles.designRoute.includes("Never claim that coverage math or plant quantities changed"), "Dialogue protects deterministic schedule"],
  ["L2-SOURCE-08", "interface", sourceFiles.resultDashboard.match(/object-contain/g)?.length >= 2, "Normal image and lightbox use object-contain"],
  ["L2-SOURCE-09", "interface", sourceFiles.css.includes("prefers-reduced-motion: reduce"), "Reduced motion is supported"],
  ["L2-SOURCE-10", "input_contract", !/Garden area/i.test(sourceFiles.projectBuilder), "No duplicate Garden area input"],
  ["L2-SOURCE-11", "input_contract", sourceFiles.projectBuilder.includes("plantingAreaIsValid") && sourceFiles.recommendRoute.includes("plantingArea <= 0"), "Client and server validate planting area"],
  ["L2-SOURCE-12", "proposal_output", sourceFiles.resultDashboard.includes("Total cover") && sourceFiles.resultDashboard.includes("plant.total_coverage"), "Schedule exposes deterministic row totals"]
];

for (const [id, category, pass, evidence] of sourceAssertions) {
  record(id, category, pass, evidence, "P0");
}

const passed = results.filter((result) => result.pass).length;
const failed = results.filter((result) => !result.pass);
const byCategory = Object.fromEntries(
  [...new Set(results.map((result) => result.category))].sort().map((category) => {
    const cases = results.filter((result) => result.category === category);
    const categoryPassed = cases.filter((result) => result.pass).length;
    return [category, { passed: categoryPassed, total: cases.length, score: Number(((categoryPassed / cases.length) * 100).toFixed(1)) }];
  })
);

const report = {
  suite: "GardenWise L2 robustness and adversarial evaluation",
  generatedAt: new Date().toISOString(),
  target: baseUrl,
  summary: {
    passed,
    failed: failed.length,
    total: results.length,
    score: Number(((passed / results.length) * 100).toFixed(1)),
    p0Failures: failed.filter((result) => result.priority === "P0").length
  },
  byCategory,
  failures: failed,
  results
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, ...report.summary, byCategory }, null, 2));
process.exitCode = failed.length ? 1 : 0;
