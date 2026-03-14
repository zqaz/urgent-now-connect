import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// FIX: Restrict CORS to a specific allowed origin instead of wildcard "*".
// Set the ALLOWED_ORIGIN secret in Supabase Vault (e.g. "https://yourapp.com").
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VALID_CARE_TYPES = new Set(["urgent_care", "er", "critical"]);

// FIX: Strict coordinate range validation constants
const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;

// FIX: URL protocol allowlist — only http/https are accepted from AI output
const SAFE_URL_REGEX = /^https?:\/\/.+/i;

function sanitizeClinicUrl(url: unknown): string {
  if (typeof url !== "string" || !SAFE_URL_REGEX.test(url.trim())) {
    return "";
  }
  return url.trim();
}

// Phone: digits and + only, 10–15 chars (E.164-ish)
function sanitizeClinicPhone(phone: unknown): string {
  if (typeof phone !== "string") return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 15) {
    return "+" + digits;
  }
  return "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { lat, lng, care_type } = body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(
        JSON.stringify({ error: "lat and lng are required numbers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // FIX: Validate coordinate ranges to prevent absurd or out-of-bounds values
    if (lat < LAT_MIN || lat > LAT_MAX || !isFinite(lat)) {
      return new Response(
        JSON.stringify({ error: "lat must be between -90 and 90" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (lng < LNG_MIN || lng > LNG_MAX || !isFinite(lng)) {
      return new Response(
        JSON.stringify({ error: "lng must be between -180 and 180" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resolvedCareType = VALID_CARE_TYPES.has(care_type) ? care_type : "urgent_care";
    const facilityType = resolvedCareType === "urgent_care" ? "urgent care clinics" : "emergency rooms";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const now = new Date();
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });
    const timeOfDay = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    const systemPrompt = `You are a medical facility locator. Given a user's GPS coordinates, find real ${facilityType} nearby and estimate realistic wait times and travel times.

Current day: ${dayOfWeek}
Current time: ${timeOfDay}

Return EXACTLY 10 facilities as a JSON array. Each object must have these exact fields:
- "id": a unique string id (e.g. "clinic-1" or "er-1")
- "name": the real name of the facility
- "address": the real street address
- "coordinates": { "lat": number, "lng": number } - the facility's real coordinates
- "wait_time_min": estimated wait time in minutes (integer, realistic for this time of day and facility type)
- "travel_time_min": estimated driving time from user's location in minutes (integer)
- "rating": a realistic rating from 3.5 to 5.0 (one decimal)
- "provider": the healthcare system name (e.g. "Swedish", "UW Medicine")
- "status": a short status label like "Shortest Wait", "Level 1 Trauma", "High Volume", "Fast Service", "Open 24/7"
- "url": a real HTTPS URL for the facility (must start with https://)
- "phone": a US phone number string for the facility (e.g. "+12065551234" or "206-555-1234") so users can call to verify insurance

Guidelines:
- Use real facility names and addresses near the given coordinates
- Wait times should be realistic: urgent care 10-60 min, ER 15-90 min
- Travel times should be proportional to distance from user
- At least one facility should have a notably short wait time
- Vary the wait times realistically

Respond with ONLY the JSON array, no other text.`;

    const requestBody = JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `User location: latitude ${lat}, longitude ${lng}. Find nearby ${facilityType}.` },
      ],
    });

    const headers = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    };

    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        { method: "POST", headers, body: requestBody }
      );
      if (response.ok || (response.status !== 500 && response.status !== 503)) break;
      console.warn(`AI gateway returned ${response.status}, retrying (attempt ${attempt + 1})...`);
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
      // FIX: Log details server-side only; return a generic message to the client
      const errorText = response ? await response.text() : "No response";
      console.error("AI gateway error:", response?.status, errorText);
      throw new Error("AI_GATEWAY_ERROR");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";

    let jsonStr = content;
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    let clinics: unknown[];
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Expected non-empty array");
      }
      clinics = parsed;
    } catch {
      console.error("Failed to parse AI clinics response:", jsonStr);
      throw new Error("AI_PARSE_ERROR");
    }

    // FIX: Sanitize every clinic object — strip or reject dangerous field values
    const sanitized = clinics.map((c: unknown, i: number) => {
      const clinic = c as Record<string, unknown>;
      return {
        id: typeof clinic.id === "string" ? clinic.id : `clinic-${i + 1}`,
        name: typeof clinic.name === "string" ? clinic.name.slice(0, 120) : "Unknown Facility",
        address: typeof clinic.address === "string" ? clinic.address.slice(0, 200) : "",
        coordinates: {
          lat: typeof clinic.coordinates === "object" &&
               clinic.coordinates !== null &&
               typeof (clinic.coordinates as Record<string, unknown>).lat === "number"
            ? Math.min(LAT_MAX, Math.max(LAT_MIN, (clinic.coordinates as Record<string, unknown>).lat as number))
            : lat,
          lng: typeof clinic.coordinates === "object" &&
               clinic.coordinates !== null &&
               typeof (clinic.coordinates as Record<string, unknown>).lng === "number"
            ? Math.min(LNG_MAX, Math.max(LNG_MIN, (clinic.coordinates as Record<string, unknown>).lng as number))
            : lng,
        },
        wait_time_min: typeof clinic.wait_time_min === "number" && clinic.wait_time_min >= 0
          ? Math.min(Math.round(clinic.wait_time_min), 240)
          : 30,
        travel_time_min: typeof clinic.travel_time_min === "number" && clinic.travel_time_min >= 0
          ? Math.min(Math.round(clinic.travel_time_min), 120)
          : 15,
        rating: typeof clinic.rating === "number"
          ? Math.min(5.0, Math.max(1.0, clinic.rating))
          : 4.0,
        provider: typeof clinic.provider === "string" ? clinic.provider.slice(0, 80) : "",
        status: typeof clinic.status === "string" ? clinic.status.slice(0, 40) : "",
        // FIX: Only allow http/https URLs; anything else (e.g. javascript:) becomes empty string
        url: sanitizeClinicUrl(clinic.url),
        phone: sanitizeClinicPhone(clinic.phone),
      };
    });

    return new Response(JSON.stringify(sanitized), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-clinics error:", e);
    // FIX: Return a generic error message — never leak internal error details to the client
    return new Response(
      JSON.stringify({ error: "Unable to fetch clinic data. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
