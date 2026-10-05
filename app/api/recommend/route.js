import { NextResponse } from "next/server";
import { buildLocalRecommendation } from "@/lib/recommendation";
import { defaultAiModel } from "@/lib/models";
import { styleById } from "@/lib/styles";

const refinementSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    concept: { type: "string" },
    styleExplanation: { type: "string" },
    seasonalCharacteristics: { type: "string" },
    maintenanceSuggestions: { type: "string" },
    spatialGuidance: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["concept", "styleExplanation", "seasonalCharacteristics", "maintenanceSuggestions", "spatialGuidance"]
};

function buildMessages(input, localResult) {
  return [
    {
      role: "system",
      content:
        "You are GardenWise AI, a professional Bay Area Zone 10a landscape design assistant. Return concise JSON only. Preserve plant schedule quantities and coverage math unless there is a clear issue."
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "Refine the planting proposal language and design rationale for a water-efficient residential garden.",
        outputContract:
          "Return one JSON object with exactly these top-level keys: concept, styleExplanation, seasonalCharacteristics, maintenanceSuggestions, spatialGuidance. spatialGuidance must be an array of short strings. Do not add wrapper keys.",
        userInput: input,
        computedPlan: localResult
      })
    }
  ];
}

function parseJsonText(text) {
  if (!text) return {};
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

function normalizeRefinement(refined) {
  if (!refined || typeof refined !== "object") return {};

  const proposal = refined.plantingProposal || {};
  const normalized = {};
  if (refined.concept || proposal.language) normalized.concept = refined.concept || proposal.language;
  if (refined.styleExplanation || proposal.designRationale) normalized.styleExplanation = refined.styleExplanation || proposal.designRationale;
  if (refined.seasonalCharacteristics) normalized.seasonalCharacteristics = refined.seasonalCharacteristics;
  if (refined.maintenanceSuggestions) normalized.maintenanceSuggestions = refined.maintenanceSuggestions;
  if (Array.isArray(refined.spatialGuidance)) normalized.spatialGuidance = refined.spatialGuidance;
  return normalized;
}

async function refineWithOpenRouter(input, localResult, apiKey) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "GardenWise AI"
    },
    body: JSON.stringify({
      model: input.aiModel || process.env.OPENROUTER_MODEL || defaultAiModel,
      messages: buildMessages(input, localResult),
      temperature: 0.35,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed with ${response.status}`);
  }

  const data = await response.json();
  return normalizeRefinement(parseJsonText(data.choices?.[0]?.message?.content));
}

async function refineWithOpenAI(input, localResult) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: buildMessages(input, localResult),
      text: {
        format: {
          type: "json_schema",
          name: "gardenwise_refinement",
          schema: refinementSchema
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`);
  }

  const data = await response.json();
  const text = data.output_text || data.output?.flatMap((item) => item.content || []).find((item) => item.text)?.text;
  return normalizeRefinement(parseJsonText(text));
}

export async function POST(request) {
  const input = await request.json();
  const plantingArea = Number(input?.plantingArea);
  if (!Number.isFinite(plantingArea) || plantingArea <= 0) {
    return NextResponse.json(
      { error: "Planting area must be a finite number greater than 0 sq ft." },
      { status: 400 }
    );
  }
  if (!["Full sun", "Partial shade", "Shade"].includes(input?.sunCondition)) {
    return NextResponse.json({ error: "Choose a valid sun condition." }, { status: 400 });
  }
  if (!["Low", "Medium"].includes(input?.maintenance)) {
    return NextResponse.json({ error: "Choose a valid maintenance preference." }, { status: 400 });
  }
  if (!styleById[input?.selectedStyle]) {
    return NextResponse.json({ error: "Choose a valid garden style." }, { status: 400 });
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY || "";
  const localResult = buildLocalRecommendation({ ...input, plantingArea });

  if (!openRouterKey && !process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ...localResult, aiMode: "local-rules" });
  }

  try {
    const provider = openRouterKey ? "openrouter" : "openai";
    const refined =
      provider === "openrouter" ? await refineWithOpenRouter(input, localResult, openRouterKey) : await refineWithOpenAI(input, localResult);
    return NextResponse.json({ ...localResult, ...refined, aiMode: provider });
  } catch (error) {
    return NextResponse.json({ ...localResult, aiMode: "local-rules", aiWarning: error.message });
  }
}
