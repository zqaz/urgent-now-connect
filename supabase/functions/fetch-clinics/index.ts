import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VALID_CARE_TYPES = new Set(["urgent_care", "er", "critical"]);
const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;

const SAFE_URL_REGEX = /^https?:\/\/.+/i;

function sanitizeClinicUrl(url: unknown): string {
  if (typeof url !== "string" || !SAFE_URL_REGEX.test(url.trim())) return "";
  return url.trim();
}

function sanitizeClinicPhone(phone: unknown): string {
  if (typeof phone !== "string") return "911";
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 15) return "+" + digits;
  return "911"; // Fallback to 911 for emergency services
}

interface AIConfig {
  url: string;
  model: string;
  useBearer: boolean;
  key?: string;
}

function getAIConfig(): AIConfig | null {
  const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
  if (geminiKey) {
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions?key=${geminiKey}`,
      model: "gemini-2.0-flash",
      useBearer: false,
    };
  }
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) {
    return {
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      key: lovableKey,
      model: "google/gemini-2.5-flash",
      useBearer: true,
    };
  }
  return null;
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

    const ai = getAIConfig();
    if (!ai) {
      throw new Error("No AI API key configured");
    }

    const now = new Date();
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });
    const timeOfDay = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    const systemPrompt = `You are a medical facility locator with access to Google Maps/Places data. Given a user's GPS coordinates, find real ${facilityType} nearby with their actual phone numbers.

Current day: ${dayOfWeek}
Current time: ${timeOfDay}

Return EXACTLY 10 facilities as a JSON array. Each object must have these exact fields:
- "id": a unique string id (e.g. "clinic-1" or "er-1")
- "name": the REAL name of the facility from Google Maps/Places
- "address": the REAL street address
- "coordinates": { "lat": number, "lng": number } - the facility's REAL GPS coordinates
- "wait_time_min": estimated wait time in minutes (integer, realistic for this time of day and facility type)
- "travel_time_min": estimated driving time from user's location in minutes (integer)
- "rating": the REAL Google rating from 3.5 to 5.0 (one decimal)
- "provider": the healthcare system name (e.g. "Swedish", "UW Medicine", "ZoomCare", "MultiCare")
- "status": a short status label like "Shortest Wait", "Level 1 Trauma", "High Volume", "Fast Service", "Open 24/7"
- "url": a REAL HTTPS URL for the facility from Google Maps (must start with https://)
- "phone": the REAL phone number from Google Maps/Places in format "+12065551234" - THIS IS REQUIRED FOR EVERY FACILITY

CRITICAL: EVERY facility MUST include a valid phone number. Look up the real phone number from Google Maps/Places data. Users need to call to verify insurance coverage.

Guidelines:
- Use REAL facility data from Google Maps/Places API
- Include the REAL main phone number for each facility - NO EXCEPTIONS
- Wait times should be realistic: urgent care 10-60 min, ER 15-90 min
- Travel times should be proportional to distance from user
- At least one facility should have a notably short wait time
- Use actual Google ratings

Respond with ONLY the JSON array, no other text.`;

    const requestBody = JSON.stringify({
      model: ai.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `User location: latitude ${lat}, longitude ${lng}. Find nearby ${facilityType}.` },
      ],
    });

    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (ai.useBearer && ai.key) {
        headers["Authorization"] = `Bearer ${ai.key}`;
      }

      response = await fetch(ai.url, {
        method: "POST",
        headers,
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
        wait_time_min: typeof clinic.wait_time_min === "number" && clinic.wait_time_min >= 0 && isFinite(clinic.wait_time_min)
          ? Math.min(Math.max(0, Math.round(clinic.wait_time_min)), 240)
          : 30,
        travel_time_min: typeof clinic.travel_time_min === "number" && clinic.travel_time_min >= 0 && isFinite(clinic.travel_time_min)
          ? Math.min(Math.max(0, Math.round(clinic.travel_time_min)), 120)
          : 15,
        rating: typeof clinic.rating === "number"
          ? Math.min(5.0, Math.max(1.0, clinic.rating))
          : 4.0,
        provider: typeof clinic.provider === "string" ? clinic.provider.slice(0, 80) : "",
        status: typeof clinic.status === "string" ? clinic.status.slice(0, 40) : "",
        url: sanitizeClinicUrl(clinic.url),
        phone: sanitizeClinicPhone(clinic.phone),
      };
    });

    return new Response(JSON.stringify(sanitized), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-clinics error:", e);
    return new Response(
      JSON.stringify({ error: "Unable to fetch clinic data. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
