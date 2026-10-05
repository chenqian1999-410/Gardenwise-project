import { NextResponse } from "next/server";
import seedPlants from "@/src/data/plants.json";

function parsePlantText(text) {
  const rows = [];
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let currentType = "Plant";

  for (const line of lines) {
    if (/^[A-Z][A-Z\s/]+$/.test(line) && line.length < 40) {
      currentType = line
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .replace("Groundcovers", "Groundcover")
        .replace("Shrubs", "Shrub")
        .replace("Vines", "Vine")
        .replace("Fruit Trees", "Tree");
      continue;
    }

    const match = line.match(/^(.+?)\s{2,}(.+?)\s{2,}(\d+)\s*$/);
    if (match) {
      rows.push({
        botanical_name: match[1],
        common_name: match[2],
        plant_type: currentType,
        coverage_value_sqft: Number(match[3])
      });
    }
  }

  return rows;
}

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json({ error: "No PDF uploaded." }, { status: 400 });
  }

  try {
    const pdf = (await import("pdf-parse")).default;
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdf(buffer);
    const rows = parsePlantText(parsed.text);

    return NextResponse.json({
      fileName: file.name,
      textLength: parsed.text.length,
      parsedPlants: rows,
      parsedCount: rows.length,
      seedDatabaseCount: seedPlants.length,
      warning:
        rows.length < 20
          ? "This PDF was read successfully, but its table columns were not preserved by the browser import parser. The app is using the pre-extracted structured seed database from the provided PDF."
          : null
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "PDF parsing failed. The bundled seed database is still available for recommendations.",
        detail: error.message
      },
      { status: 500 }
    );
  }
}
