import plants from "@/src/data/plants.json";
import { styleById } from "@/lib/styles";

const typePriority = ["Tree", "Shrub", "Groundcover", "Ornamental grass", "Succulent", "Vine", "Perennial / Biennial"];
const mediumMaintenancePattern = /\b(edible|fruit|apple|pear|peach|plum|nectarine|apricot|persimmon|citrus|fig|pomegranate|avocado|jujube|ziziphus)\b/i;

function maintenanceLevel(plant) {
  if (["Low", "Medium"].includes(plant.maintenance_level)) return plant.maintenance_level;
  // The source list does not yet contain maintenance metadata. Until it does,
  // classify obvious fruit/edible plants conservatively instead of presenting
  // them as low-care choices.
  const searchableName = `${plant.botanical_name || ""} ${plant.common_name || ""}`;
  return mediumMaintenancePattern.test(searchableName) ? "Medium" : "Low";
}

function isEligible(plant, input) {
  if (!Number.isFinite(plant.coverage_value_sqft) || plant.coverage_value_sqft <= 0) return false;
  if (!plant.suitable_style_tags?.includes(input.selectedStyle)) return false;
  if (!plant.sunlight_requirement?.includes(input.sunCondition)) return false;
  if (input.maintenance === "Low" && maintenanceLevel(plant) !== "Low") return false;
  return true;
}

function scorePlant(plant, input) {
  let score = 0;
  if (plant.coverage_value_sqft <= 120) score += 2;
  if (maintenanceLevel(plant) === "Low") score += 2;
  if (plant.plant_type === "Groundcover") score += 1;
  return score;
}

function pickByType(candidates, plantType, count) {
  return candidates.filter((plant) => plant.plant_type === plantType).slice(0, count);
}

export function buildLocalRecommendation(input) {
  const plantingArea = Number(input.plantingArea);
  if (!Number.isFinite(plantingArea) || plantingArea <= 0) {
    throw new RangeError("Planting area must be a finite number greater than 0 sq ft.");
  }
  const requiredCoverage = Math.round(plantingArea * 0.5);
  const style = styleById[input.selectedStyle] || styleById["california-native"];

  const candidates = [...plants]
    .filter((plant) => isEligible(plant, input))
    .map((plant) => ({ ...plant, maintenance_level: maintenanceLevel(plant), score: scorePlant(plant, input) }))
    .sort((a, b) => b.score - a.score || a.coverage_value_sqft - b.coverage_value_sqft);

  const palette = [
    ...pickByType(candidates, "Tree", 1),
    ...pickByType(candidates, "Shrub", 4),
    ...pickByType(candidates, "Groundcover", 4),
    ...pickByType(candidates, "Ornamental grass", 2),
    ...pickByType(candidates, "Succulent", 2),
    ...pickByType(candidates, "Perennial / Biennial", 2)
  ];

  const uniquePalette = Array.from(new Map(palette.map((plant) => [plant.id, plant])).values()).slice(0, 14);
  const schedule = [];
  let totalCoverage = 0;

  for (const plant of uniquePalette) {
    if (totalCoverage >= requiredCoverage * 1.08 && schedule.length >= 7) break;
    const baseQty = plant.plant_type === "Tree" ? 1 : plant.plant_type === "Shrub" ? 3 : plant.plant_type === "Groundcover" ? 8 : 5;
    const remaining = Math.max(requiredCoverage - totalCoverage, plant.coverage_value_sqft);
    const quantity = Math.max(1, Math.min(baseQty, Math.ceil(remaining / plant.coverage_value_sqft)));
    const rowCoverage = quantity * plant.coverage_value_sqft;
    schedule.push({
      ...plant,
      quantity,
      total_coverage: rowCoverage
    });
    totalCoverage += rowCoverage;
  }

  if (totalCoverage < requiredCoverage) {
    const filler = candidates.find((plant) => plant.plant_type === "Groundcover" && !schedule.some((row) => row.id === plant.id));
    if (filler) {
      const quantity = Math.ceil((requiredCoverage - totalCoverage) / filler.coverage_value_sqft);
      schedule.push({ ...filler, quantity, total_coverage: quantity * filler.coverage_value_sqft });
      totalCoverage += quantity * filler.coverage_value_sqft;
    }
  }

  const pass = totalCoverage >= requiredCoverage;

  return {
    generatedAt: new Date().toISOString(),
    location: "California Bay Area, USDA Zone 10a",
    style,
    siteSummary: {
      plantingArea,
      sunCondition: input.sunCondition,
      maintenance: input.maintenance,
      uploadedPlanName: input.uploadedPlanName || null
    },
    concept:
      `${style.name} concept for a Zone 10a water-efficient residential garden with layered canopy, durable shrub structure, and plant spacing sized to mature coverage.`,
    styleExplanation:
      `${style.description} The palette emphasizes plants from the qualifying low-water database, then balances coverage, hierarchy, and visual texture for rebate-ready planting density.`,
    seasonalCharacteristics:
      "Spring bloom and fresh foliage establish the garden, summer relies on drought-adapted structure, fall adds seed heads and warm texture, and evergreen shrubs keep winter form legible.",
    maintenanceSuggestions:
      input.maintenance === "Low"
        ? "Use drip irrigation during establishment, mulch open soil, prune shrubs lightly once or twice per year, and group plants by water need."
        : "Use drip irrigation, seasonal deadheading, selective shaping, and periodic infill edits to keep the design crisp while maintaining low water use.",
    spatialGuidance: [
      "Place trees or tallest shrubs on western and rear edges for shade and privacy without closing the garden.",
      "Use shrubs as middle-layer masses around paths, patios, and views from the house.",
      "Run groundcovers and grasses through open planting zones to meet coverage while keeping hardscape visible.",
      "Reserve succulents or distinctive forms for entries, corners, and focal points near seating areas."
    ],
    coverage: {
      requiredCoverage,
      totalCoverage,
      plantingArea,
      pass,
      message: pass
        ? "PASS: Meets the 50% mature plant coverage requirement."
        : "Needs adjustment: add groundcovers or increase shrub quantities to meet the 50% mature coverage requirement."
    },
    plantSchedule: schedule.map((plant) => ({
      botanical_name: plant.botanical_name,
      common_name: plant.common_name,
      plant_type: plant.plant_type,
      quantity: plant.quantity,
      mature_coverage: plant.coverage_value_sqft,
      total_coverage: plant.total_coverage,
      maintenance_level: plant.maintenance_level,
      design_purpose: plant.design_purpose
    })),
    candidateCount: candidates.length
  };
}

export function getPlantDatabaseStats() {
  return {
    total: plants.length,
    byType: typePriority.map((type) => ({
      type,
      count: plants.filter((plant) => plant.plant_type === type).length
    }))
  };
}
