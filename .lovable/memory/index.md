Design system: clean/calm blue-white theme with Plus Jakarta Sans font. Custom tokens: --emergency, --success, --warning.
App: Urgent Now — emergency medical facility finder.
AI: Uses GOOGLE_GEMINI_API_KEY (stored as secret) with direct Gemini API; falls back to LOVABLE_API_KEY.
Edge Functions: triage-evaluate, fetch-clinics — both support Gemini direct + Lovable gateway.
Pages: Home (/), Results (/results), First Aid (/first-aid).
