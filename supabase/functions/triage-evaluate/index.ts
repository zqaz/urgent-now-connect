import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_TRANSCRIPT_BYTES = 2000;
const VALID_CARE_TYPES = new Set(["urgent_care", "er", "critical"]);
const VALID_SEVERITIES = new Set(["low", "moderate", "high", "critical"]);

function getAIConfig() {
  const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
  if (geminiKey) {
    return {
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      key: geminiKey,
      model: "gemini-2.0-flash",
    };
  }
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) {
    return {
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      key: lovableKey,
      model: "google/gemini-2.5-flash",
    };
  }
  throw new Error("No AI API key configured. Set GOOGLE_GEMINI_API_KEY or enable Lovable Cloud.");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { transcript } = body;

    if (!transcript || typeof transcript !== "string") {
      return new Response(
        JSON.stringify({ error: "transcript is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new TextEncoder().encode(transcript).length > MAX_TRANSCRIPT_BYTES) {
      return new Response(
        JSON.stringify({ error: "transcript is too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ai = getAIConfig();

    const systemPrompt = `You are a medical triage AI assistant. Based on the patient's symptom description, determine whether they need:
1. "urgent_care" - symptoms that are concerning but not life-threatening (e.g., sprains, mild infections, cuts needing stitches, fever, ear pain, UTI symptoms, minor burns, rashes)
2. "er" - symptoms that require emergency room care (e.g., chest pain, difficulty breathing, severe bleeding, head trauma, stroke symptoms, severe allergic reactions, broken bones with deformity, seizures, loss of consciousness)
3. "critical" - immediately life-threatening symptoms requiring 911 (e.g., signs of heart attack, stroke in progress, severe trauma, unable to breathe, heavy uncontrolled bleeding)

You MUST respond with ONLY a JSON object with these exact fields:
- "care_type": one of "urgent_care", "er", or "critical"
- "severity": one of "low", "moderate", "high", or "critical" (use "low" or "moderate" for urgent_care, "high" for er, "critical" for critical/911)
- "recommendation": a 1-2 sentence recommendation for the patient (max 300 characters)

Example response:
{"care_type":"urgent_care","severity":"moderate","recommendation":"Your symptoms suggest a minor condition that can be treated at an urgent care clinic."}

Respond with ONLY the JSON object, no other text.`;

    const requestBody = JSON.stringify({
      model: ai.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Patient describes: "${transcript}"` },
      ],
    });

    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(ai.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ai.key}`,
          "Content-Type": "application/json",
        },
        body: requestBody,
      });
      if (response.ok || (response.status !== 500 && response.status !== 503)) break;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }

    if (!response || !response.ok) {
      if (response?.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response?.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage quota exceeded." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI_GATEWAY_ERROR");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";

    let jsonStr = content;
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response JSON:", jsonStr);
      throw new Error("AI_PARSE_ERROR");
    }

    if (typeof result.care_type !== "string" || !VALID_CARE_TYPES.has(result.care_type)) {
      console.error("Invalid care_type from AI:", result.care_type);
      throw new Error("AI_INVALID_RESPONSE");
    }
    if (typeof result.severity !== "string" || !VALID_SEVERITIES.has(result.severity)) {
      console.error("Invalid severity from AI:", result.severity);
      throw new Error("AI_INVALID_RESPONSE");
    }
    if (typeof result.recommendation !== "string" || result.recommendation.trim() === "") {
      console.error("Missing recommendation from AI");
      throw new Error("AI_INVALID_RESPONSE");
    }

    const safeRecommendation = result.recommendation.slice(0, 300);

    return new Response(
      JSON.stringify({
        care_type: result.care_type,
        severity: result.severity,
        recommendation: safeRecommendation,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("triage-evaluate error:", e);
    return new Response(
      JSON.stringify({ error: "Unable to evaluate symptoms. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
