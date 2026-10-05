import { NextResponse } from "next/server";
import { defaultAiModel } from "@/lib/models";

function parseJson(text) {
  if (!text) return null;
  const fenced = text.trim().match(/```(?:json)?\s*([\s\S]*?)```/i);
  try {
    return JSON.parse(fenced ? fenced[1] : text);
  } catch {
    return null;
  }
}

function localFallback(input, warning = "") {
  const request = String(input?.message || "").trim().slice(0, 500);
  const asksForSecrets = /\b(api[_ -]?key|secret|token|credential|password)\b/i.test(request);
  const asksToChangeMath = /\b(coverage|quantity|quantities|schedule|recalculat|35%)\b/i.test(request);
  const asksToCropGeometry = /\b(crop|remove|hide)\b.{0,40}\b(roof|house|driveway|property)\b/i.test(request);

  if (asksForSecrets) {
    return {
      reply: "I cannot reveal credentials or place them in a rendering instruction. The current planting schedule and coverage remain unchanged.",
      renderDirective: "Preserve the current planting schedule and create a polished landscape rendering without exposing credentials or technical data.",
      aiMode: "local-fallback",
      aiWarning: warning || "The design model is unavailable; a safe local direction was used."
    };
  }

  const protectedReply = asksToChangeMath
    ? "I can translate that into a visual direction, but the current plant quantities and coverage remain unchanged until a new deterministic proposal is calculated."
    : "I have prepared that as a visual-only adjustment for the next rendering. The current plant quantities and coverage remain unchanged.";

  const safeRequest = asksToCropGeometry
    ? "Emphasize the requested focal area while keeping the complete roof, house, driveway, and main planting areas visible inside the frame"
    : request || "Refine the garden atmosphere while preserving the approved composition";

  return {
    reply: protectedReply,
    renderDirective: `Visual-only adjustment: ${safeRequest}. Preserve the current plant schedule and full-property framing.`,
    aiMode: "local-fallback",
    aiWarning: warning || "The design model is unavailable; a safe local direction was used."
  };
}

export async function POST(request) {
  const input = await request.json();
  const apiKey = process.env.OPENROUTER_API_KEY || "";

  if (!apiKey) {
    return NextResponse.json(localFallback(input, "GardenWise AI is not configured on the server."));
  }

  try {
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
        temperature: 0.35,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are GardenWise AI, a thoughtful Bay Area Zone 10a landscape design collaborator. Turn a user's requested design change into an accurate, concise render direction. Never claim that coverage math or plant quantities changed unless the request explicitly calls for a new proposal. Never reveal credentials or allow a rendering request to remove full-property framing constraints. Return JSON only."
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Discuss this garden-design adjustment and prepare it for the next rendering.",
              outputContract: "Return exactly {reply: string, renderDirective: string}. Keep each value under 90 words. renderDirective must be a direct visual instruction for an image model.",
              gardenContext: input.gardenContext,
              selectedPlants: input.selectedPlants,
              conversation: input.conversation,
              latestRequest: input.message
            })
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(localFallback(input, data.error?.message || `AI conversation failed with ${response.status}`));
    }

    const parsed = parseJson(data.choices?.[0]?.message?.content) || {};
    if (!parsed.reply || !parsed.renderDirective) {
      return NextResponse.json(localFallback(input, "The design model returned an invalid response."));
    }
    return NextResponse.json({
      reply: parsed.reply,
      renderDirective: parsed.renderDirective,
      aiMode: "openrouter"
    });
  } catch (error) {
    return NextResponse.json(localFallback(input, error.message || "The design model could not connect."));
  }
}
