import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { performRuleBasedTriage, isValidTriageResult } from "./rule-based-triage.ts";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_TRANSCRIPT_BYTES = 2000;
const VALID_CARE_TYPES = new Set(["urgent_care", "er", "critical"]);
const VALID_SEVERITIES = new Set(["low", "moderate", "high", "critical"]);

interface AIConfig {
  url: string;
  model: string;
  useBearer: boolean;
  key?: string;
}

function getAIConfig(): AIConfig | null {
  const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
  if (geminiKey) {
    // Gemini OpenAI-compatible endpoint requires API key in URL query parameter
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions?key=${geminiKey}`,
      model: "gemini-2.0-flash",
      useBearer: false, // Don't use Bearer token for direct Gemini API
    };
  }
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) {
    // Lovable gateway uses standard Bearer token authentication
    return {
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      key: lovableKey,
      model: "google/gemini-2.5-flash",
      useBearer: true, // Use Bearer token for Lovable gateway
    };
  }
  return null; // No AI available, will use rule-based fallback
}

async function tryAITriage(transcript: string, ai: AIConfig): Promise<Record<string, unknown> | null> {
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

  // Retry up to 3 times for transient errors
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Only add Authorization header for services that use Bearer tokens (Lovable)
      if (ai.useBearer && ai.key) {
        headers["Authorization"] = `Bearer ${ai.key}`;
      }

      response = await fetch(ai.url, {
        method: "POST",
        headers,
        body: requestBody,
      });

      // Break if successful or non-retryable error
      if (response.ok || (response.status !== 500 && response.status !== 503)) {
        break;
      }

      // Wait before retry (exponential backoff)
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    } catch (fetchError) {
      console.error(`AI fetch attempt ${attempt + 1} failed:`, fetchError);
      if (attempt === 2) return null; // All retries exhausted
    }
  }

  if (!response || !response.ok) {
    console.error(`AI request failed with status: ${response?.status}`);
    return null;
  }

  try {
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";

    if (!content) {
      console.error("Empty content from AI response");
      return null;
    }

    // Parse the JSON response (handle markdown code blocks)
    let jsonStr = content;
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const result = JSON.parse(jsonStr);

    // Validate the result
    if (!isValidTriageResult(result)) {
      console.error("Invalid AI response format:", result);
      return null;
    }

    return result;
  } catch (parseError) {
    console.error("Failed to parse AI response:", parseError);
    return null;
  }
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

    // Try AI-based triage first
    const aiConfig = getAIConfig();
    let result: { care_type: string; severity: string; recommendation: string } | null = null;
    let triageMethod = "unknown";

    if (aiConfig) {
      console.log("🤖 Attempting AI-based triage...");
      console.log(`   Transcript: "${transcript}"`);
      result = await tryAITriage(transcript, aiConfig);
      if (result) {
        triageMethod = "AI";
        console.log("✅ AI triage successful");
        console.log(`   Result: care_type=${result.care_type}, severity=${result.severity}`);
      }
    }

    // Fall back to rule-based triage if AI fails or unavailable
    if (!result) {
      console.log("📋 AI triage unavailable or failed, using rule-based fallback");
      console.log(`   Transcript: "${transcript}"`);
      result = performRuleBasedTriage(transcript);
      triageMethod = "RULE-BASED";
      console.log("✅ Rule-based triage completed");
      console.log(`   Result: care_type=${result.care_type}, severity=${result.severity}`);
    }

    console.log(`\n🏥 TRIAGE COMPLETED via ${triageMethod}`);
    console.log(`   Input: "${transcript}"`);
    console.log(`   Output: ${JSON.stringify(result)}\n`);

    // Final validation
    if (typeof result.care_type !== "string" || !VALID_CARE_TYPES.has(result.care_type)) {
      console.error("Invalid care_type:", result.care_type);
      throw new Error("INVALID_TRIAGE_RESULT");
    }
    if (typeof result.severity !== "string" || !VALID_SEVERITIES.has(result.severity)) {
      console.error("Invalid severity:", result.severity);
      throw new Error("INVALID_TRIAGE_RESULT");
    }
    if (typeof result.recommendation !== "string" || result.recommendation.trim() === "") {
      console.error("Missing recommendation");
      throw new Error("INVALID_TRIAGE_RESULT");
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

    // Even in catastrophic failure, provide a safe default response
    // This ensures the user always gets help
    return new Response(
      JSON.stringify({
        care_type: "urgent_care",
        severity: "moderate",
        recommendation: "We recommend visiting an urgent care clinic for evaluation of your symptoms.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
