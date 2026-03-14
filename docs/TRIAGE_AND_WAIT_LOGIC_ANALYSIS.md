# Triage and Wait Logic — Analysis

This document describes how **triage** and **wait/time** logic work in the app, where **AI** is used, and what to consider before changing behavior.

---

## 1. Triage Logic (What It Is and How It Flows)

### 1.1 Definition

**Triage** here means: given the user’s **symptom description** (speech or text), the system decides:

- **care_type**: one of `urgent_care` | `er` | `critical`
- **severity**: `low` | `moderate` | `high` | `critical`
- **recommendation**: a short, user-facing sentence (e.g. “Your symptoms suggest…”).

That result drives:

- Whether we show **urgent care** vs **ER** facilities.
- Whether we show the **critical/911** overlay.
- What **recommendation** and **severity** we show in the dashboard.

### 1.2 End-to-end flow

1. **User input**  
   User describes symptoms (voice or text) and confirms on the “confirm transcript” step.

2. **App state**  
   `Index.tsx` sets `appState = "analyzing"` and shows `TriageLoader`.

3. **Triage request**  
   When the loader’s progress reaches 100%, `handleAnalysisComplete()` runs and:
   - Calls **Supabase Edge Function** `triage-evaluate` with `{ transcript }`.
   - Expects back: `{ care_type, severity, recommendation }` (`TriageResult`).

4. **After triage**
   - Result is stored in state (`setTriageResult`) and history (`addEntry`).
   - If `profile.insurance_id` is set → skip insurance picker, call `fetchClinics(care_type)` and go to dashboard/ER dashboard (or critical overlay).
   - If not → show insurance picker; after selection/skip, `proceedWithInsurance` calls `fetchClinics(care_type)` and then shows dashboard/ER dashboard.

5. **Failure path**  
   If `triage-evaluate` fails (e.g. no Supabase, no Edge Function, or API error):
   - Catch block sets a fallback `TriageResult`: `care_type: "urgent_care"`, `severity: "moderate"`, generic recommendation.
   - Shows a friendly toast and still goes to **insurance_select**, then dashboard with **mock clinics** (no real AI triage, no real clinic fetch).

So: **triage** = “symptom → care_type + severity + recommendation” and **drives which list of facilities we fetch and which UI we show**.

---

## 2. How AI Is Involved in Triage

AI is used in **one place only**: the **Supabase Edge Function** `triage-evaluate`.

### 2.1 Where it runs

- **File**: `supabase/functions/triage-evaluate/index.ts`
- **Trigger**: HTTP request from the client via `supabase.functions.invoke("triage-evaluate", { body: { transcript } })`.

### 2.2 What the AI does

- **Model**: `google/gemini-2.5-flash` via **Lovable AI gateway** (`https://ai.gateway.lovable.dev/v1/chat/completions`).
- **Input**:  
  - System prompt: defines the triage rules (urgent_care vs er vs critical) and the exact JSON shape.  
  - User message: `Patient describes: "${transcript}"`.
- **Output**: One JSON object with:
  - `care_type`: `"urgent_care"` | `"er"` | `"critical"`
  - `severity`: `"low"` | `"moderate"` | `"high"` | `"critical"`
  - `recommendation`: string (capped at 300 chars server-side).

### 2.3 Safety and validation (server-side)

- Transcript length limited (e.g. max bytes) to avoid cost/prompt abuse.
- Response is parsed and validated with **allowlists** for `care_type` and `severity`.
- Recommendation is truncated to 300 characters.
- Generic error messages returned to client; details only in server logs.
- Retries on 5xx (e.g. 500/503); rate limit (429) and quota (402) handled with clear responses.

So: **AI is used only for triage** (symptom → care_type + severity + recommendation). There is **no AI in the client** and **no AI in the wait-time calculation** itself.

---

## 3. Wait and Time Logic

“Wait” in the UI means **two separate numbers** that are **never computed in the client** from live APIs:

- **wait_time_min** — estimated time to be seen at the facility (e.g. “wait at clinic”).
- **travel_time_min** — estimated drive time from user to facility.

### 3.1 Where wait_time_min and travel_time_min come from

| Source | Who produces the values | When it’s used |
|--------|--------------------------|----------------|
| **fetch-clinics Edge Function** | AI (Gemini via Lovable gateway) | When Supabase is configured and the function is deployed. Request body: `lat`, `lng`, `care_type`. AI returns up to 10 facilities with `wait_time_min`, `travel_time_min`, and other fields. |
| **Mock data** | Static files | When `fetch-clinics` fails or is not configured. `mockClinics.ts` and `mockERs.ts` define fixed `wait_time_min` and `travel_time_min` per facility. |

So:

- **With backend**: Wait and travel times are **AI-generated estimates** in `fetch-clinics` (see below).
- **Without backend**: They are **static mock values** only.

There is **no** real-time wait API (e.g. from clinics or a third party) in this codebase.

### 3.2 fetch-clinics Edge Function (AI and wait/travel)

- **File**: `supabase/functions/fetch-clinics/index.ts`
- **Input**: `lat`, `lng`, `care_type` (validated; default `urgent_care` if invalid).
- **AI role**:
  - Model: `google/gemini-2.5-flash` again via Lovable gateway.
  - System prompt asks for real facilities near the coordinates and **explicitly**:
    - `wait_time_min`: “estimated wait time in minutes (integer, realistic for this time of day and facility type)”.
    - `travel_time_min`: “estimated driving time from user's location in minutes (integer)”.
  - Guidelines in the prompt: e.g. urgent care 10–60 min wait, ER 15–90 min; travel proportional to distance; vary wait times.

So **wait and travel are AI-estimated** in the backend when `fetch-clinics` is used; the client only displays and sorts them.

### 3.3 What the client does with wait and travel

- **Enrichment**: `enrichAndFilter()` in `Index.tsx` adds `distance_miles` from user location to each clinic (Haversine in `src/lib/geo.ts`). It does **not** recompute `wait_time_min` or `travel_time_min`.
- **Sorting (Dashboard / ERDashboard)**:
  - First by **insurance network status**: in_network → call_to_verify → out_of_network (and `none` treated with in_network for sort).
  - Within each group, by **total time** = `wait_time_min + travel_time_min` (ascending).
- **“Winner”**: First item in that sorted list is the “winner” (shortest total among the top network tier); the rest are listed below.
- **Display**: `ClinicCard` and `WinnerCard` show `wait_time_min`, `travel_time_min`, and total; `MapView` sorts markers by `wait_time_min` for display.

So: **no client-side “wait logic”** — only **use of server/mock-provided wait and travel + distance enrichment and sorting**.

---

## 4. Summary Table

| Concern | Where it lives | Role of AI | Who produces values |
|--------|----------------|------------|----------------------|
| **Triage** (care_type, severity, recommendation) | Edge Function `triage-evaluate` | 100% AI (Gemini) from symptom text | AI only |
| **Wait time** (wait_time_min) | Edge Function `fetch-clinics` or mock data | AI in `fetch-clinics`; none in mock | AI or static mock |
| **Travel time** (travel_time_min) | Same as above | AI in `fetch-clinics`; none in mock | AI or static mock |
| **Distance** (distance_miles) | Client `enrichAndFilter` + `lib/geo.ts` | None | Client (Haversine) |
| **Sorting / “winner”** | Dashboard, ERDashboard | None | Client (network status then total time) |

---

## 5. What to Consider Before Making Changes

### 5.1 Changing triage behavior

- **Prompt changes**  
  All triage rules live in the **system prompt** in `triage-evaluate/index.ts`. Changing thresholds (e.g. when to say “er” vs “urgent_care”) or adding new care types means:
  - Updating the prompt.
  - Updating `VALID_CARE_TYPES` / `VALID_SEVERITIES` and the TypeScript type `TriageResult` / `CareType` so the client and RLS stay in sync.
- **No AI (e.g. rule-based triage)**  
  You could replace the AI call with a rule-based classifier in the Edge Function. Then you’d remove the Lovable gateway call and the `LOVABLE_API_KEY` dependency for triage only; `fetch-clinics` could still use AI if desired.
- **Different model or provider**  
  Swap the gateway URL and model in `triage-evaluate`; keep the same request/response contract so the client does not need changes.

### 5.2 Changing wait / travel logic

- **Real wait times**  
  Right now there is **no** integration with real-time wait APIs (e.g. from clinics or a vendor). Adding that would require:
  - A new data source (API or Supabase table).
  - Either replacing or combining with AI-generated values in `fetch-clinics` (e.g. use real wait when available, else AI estimate).
  - Deciding how to handle facilities with no real data (fallback to AI or to a default).
- **Travel time from a real API**  
  Currently travel is AI-estimated in `fetch-clinics`. You could instead compute it in the client or in an Edge Function using a routing API (e.g. Google Directions, Mapbox). That would mean:
  - Dropping or only using AI for `travel_time_min` when the routing API is unavailable.
  - Possibly rate limits and API keys for the routing provider.
- **Client-side only (mock + distance)**  
  If you never call `fetch-clinics` (e.g. always use mocks), the only “logic” is mock values plus client `distance_miles`. You could add a **client-side** estimate of travel time from distance (e.g. assume average speed) without any backend change, but that would not be “real” travel or wait.

### 5.3 Changing the “analyzing” UX

- **TriageLoader** is purely **time-based** (progress 0→100% on a timer); it does **not** wait for the real `triage-evaluate` response. So:
  - The real triage request is fired when the loader hits 100%; the user then waits for the HTTP response before the next step.
  - If you want “analyzing” to truly reflect server progress, you’d need to either drive the loader from the actual request (e.g. show “Analyzing…” until the request resolves) or keep the current “fake” progress and only block navigation on the real response (already the case).
- **Copy** in the loader (“Processing audio transcript…”, “Generating triage recommendation…”, etc.) is static and does not reflect whether the backend is actually used; consider clarifying in UX that this is “Evaluating your symptoms” and then “Finding options” so it matches both AI and fallback flows.

### 5.4 Dependencies and environment

- **Triage** and **fetch-clinics** both require:
  - Supabase project and deployed Edge Functions.
  - `LOVABLE_API_KEY` set in the Supabase Edge Function secrets (for the Lovable AI gateway).
- If either function is missing or the key is not set, the app falls back to:
  - Triage: `care_type: "urgent_care"`, generic recommendation, then insurance picker.
  - Clinics: mock data only (no AI-generated wait/travel).

So any change that assumes “AI always runs” must account for the fallback path (no Supabase or no key).

---

## 6. File Reference

| Purpose | File(s) |
|--------|---------|
| Triage (AI) | `supabase/functions/triage-evaluate/index.ts` |
| Clinic fetch + wait/travel (AI or error → mock) | `supabase/functions/fetch-clinics/index.ts` |
| Triage flow and fallback | `src/pages/Index.tsx` (`handleAnalysisComplete`, `fetchClinics`) |
| Triage result type | `src/data/types.ts` (`TriageResult`, `CareType`) |
| “Analyzing” loader (progress only, no server wait) | `src/components/TriageLoader.tsx` |
| Distance (client) | `src/lib/geo.ts`, `enrichAndFilter` in `Index.tsx` |
| Sorting and display of wait/travel | `src/components/Dashboard.tsx`, `src/components/ERDashboard.tsx`, `ClinicCard`, `WinnerCard`, `MapView` |
| Mock wait/travel values | `src/data/mockClinics.ts`, `src/data/mockERs.ts` |

This should give you a single place to reason about triage, wait logic, and AI before changing behavior.
