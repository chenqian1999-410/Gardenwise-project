import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultImageModel } from "@/lib/models";

function findImageUrl(value) {
  if (!value || typeof value !== "object") return null;

  if (typeof value.url === "string" && value.url.startsWith("data:image")) return value.url;
  if (typeof value.image_url?.url === "string") return value.image_url.url;
  if (typeof value.data === "string" && value.mime_type?.startsWith("image/")) {
    return `data:${value.mime_type};base64,${value.data}`;
  }
  if (typeof value.b64_json === "string") return `data:image/png;base64,${value.b64_json}`;

  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findImageUrl(item);
        if (found) return found;
      }
    } else if (child && typeof child === "object") {
      const found = findImageUrl(child);
      if (found) return found;
    }
  }

  return null;
}

function buildRenderPrompt(input) {
  const hasPlanImage = typeof input.planImageDataUrl === "string" && input.planImageDataUrl.startsWith("data:image/");
  const selectedPlants = (input.selectedPlants || [])
    .map((plant) => `${plant.quantity}x ${plant.common_name || plant.botanical_name}`)
    .join(", ");

  return [
    input.renderPrompt,
    "",
    "Generate one polished photorealistic landscape rendering, not a plan diagram, not a UI screenshot, and not a labeled map.",
    hasPlanImage
      ? "Use the uploaded architectural drawing as the exact geometry source. Preserve the residence, complete roof footprint, garage, driveway, paths, patios, side setbacks, hardscape boundaries, and yard proportions."
      : "No usable site-plan image was supplied. This must be a conceptual residential visualization only. Do not claim or imply that the imagined architecture, driveway, boundaries, or proportions match the user's property.",
    hasPlanImage
      ? "Transform the drawing into a finished residential garden visualization with realistic planting, scale, shadows, materials, and depth."
      : "Create a complete illustrative residential composition with realistic planting, scale, shadows, materials, and depth.",
    "Do not add text labels, captions, zoning boxes, UI elements, or diagram overlays.",
    "Show the complete composition in the generated image. Keep the entire building roof fully visible inside the frame. Do not crop off the property, house, roof, driveway, or main planting areas.",
    selectedPlants ? `Selected plants to render: ${selectedPlants}.` : "",
    input.style?.name ? `Garden style: ${input.style.name}.` : "",
    input.additionalRequirements ? `Additional user requirements: ${input.additionalRequirements}` : "",
    "Camera: elevated 3/4 aerial architectural visualization showing the full plan relationship, professional landscape portfolio quality, natural daylight.",
    hasPlanImage
      ? "NON-NEGOTIABLE FINAL CONSTRAINT: preserve the uploaded geometry, keep the complete roof and property inside the frame, and do not crop the house, driveway, or main planting areas. This overrides conflicting user additions."
      : "NON-NEGOTIABLE FINAL CONSTRAINT: this is conceptual, not property-specific. Keep the complete imagined composition inside the frame and do not claim exact geometry. This overrides conflicting user additions."
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request) {
  const input = await request.json();
  const openRouterKey = process.env.OPENROUTER_API_KEY || "";

  if (!openRouterKey) {
    return NextResponse.json({ error: "OpenRouter API key is not configured on the server." }, { status: 400 });
  }

  const model = input.imageModel || process.env.OPENROUTER_IMAGE_MODEL || defaultImageModel;
  const hasPlanImage = typeof input.planImageDataUrl === "string" && input.planImageDataUrl.startsWith("data:image/");
  const prompt = buildRenderPrompt(input);
  const content = hasPlanImage
    ? [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: input.planImageDataUrl } }
      ]
    : prompt;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "GardenWise AI"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              hasPlanImage
                ? "You are a photorealistic landscape rendering model. Generate a finished image from the uploaded architectural plan and written landscape design prompt. Preserve the supplied geometry exactly and keep the complete property composition inside the frame."
                : "You are a photorealistic landscape rendering model. Generate a conceptual residential garden image from the written brief. No site plan was supplied, so do not claim property-specific geometry. Keep the complete imagined property composition inside the frame."
          },
          { role: "user", content }
        ],
        modalities: ["image", "text"],
        temperature: 0.25
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.error?.message || `OpenRouter image request failed with ${response.status}`,
          model,
          prompt
        },
        { status: response.status }
      );
    }

    const imageUrl = findImageUrl(data);
    const text = data.choices?.[0]?.message?.content;
    let publicPath = null;

    const match = imageUrl?.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match && !process.env.VERCEL) {
      try {
        const ext = match[1].includes("jpeg") ? "jpg" : "png";
        const fileName = `gardenwise-render-${Date.now()}.${ext}`;
        const outputDir = path.join(process.cwd(), "public", "renderings");
        await mkdir(outputDir, { recursive: true });
        await writeFile(path.join(outputDir, fileName), Buffer.from(match[2], "base64"));
        publicPath = `/api/rendering-file/${fileName}`;
      } catch {
        publicPath = null;
      }
    }

    return NextResponse.json({
      aiMode: "openrouter-image",
      model,
      imageUrl,
      publicPath,
      text: typeof text === "string" ? text : "",
      geometryMode: hasPlanImage ? "source-plan" : "conceptual",
      prompt,
      rawShape: imageUrl ? undefined : Object.keys(data)
    });
  } catch (error) {
    return NextResponse.json({ error: error.message, model, prompt }, { status: 500 });
  }
}
