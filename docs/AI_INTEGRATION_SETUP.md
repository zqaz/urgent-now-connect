# AI Integration Setup (Lovable Only)

This app uses **Lovable’s AI gateway** for:

1. **triage-evaluate** — symptom text → care type (urgent_care / er / critical) + recommendation  
2. **fetch-clinics** — user location → list of facilities with wait/travel times  

**LOVABLE_API_KEY** is automatically provisioned when you use **Lovable Cloud** — you do not need to obtain or configure the key manually.

---

## Step 1: Enable Lovable Cloud (recommended)

If this project is linked to Lovable (e.g. created from or connected to [Lovable](https://lovable.dev)):

1. Open your project in **Lovable**.  
2. **Enable Lovable Cloud** for this project.  
3. Lovable will inject **LOVABLE_API_KEY** into your Supabase Edge Functions as a secret. No need to copy a key or add it in Supabase.

Your `triage-evaluate` and `fetch-clinics` Edge Functions will then have access to `LOVABLE_API_KEY` automatically.

---

## Step 2: CORS (optional)

If you want to restrict which origins can call your Edge Functions:

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Project Settings** → **Edge Functions** (or **Vault**).  
2. Add secret:
   - **Name:** `ALLOWED_ORIGIN`  
   - **Value:** `http://localhost:8080` (dev) or your production URL (e.g. `https://yourapp.com`)

---

## Step 3: Deploy the Edge Functions

From your project root (where `supabase/` lives):

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy triage-evaluate
npx supabase functions deploy fetch-clinics
```

Replace `YOUR_PROJECT_REF` with your Supabase project reference (from the project URL or dashboard).

---

## Step 4: Configure the front-end

1. Copy `.env.example` to `.env`.  
2. In `.env`, set:
   - `VITE_SUPABASE_URL` — your Supabase project URL (e.g. `https://xxxx.supabase.co`)  
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — your project’s anon/public key  

You can find both in Supabase: **Project Settings** → **API**.

---

## Step 5: Run and test

1. Start the app: `npm run dev`  
2. Open the app, allow location, describe symptoms, and confirm.  
3. You should see a triage result and then the insurance step, then the clinic list (from Lovable AI). If you see “Using urgent care options” and mock data, the key is missing or wrong, or the functions aren’t deployed — check Supabase function logs.

---

## Checklist

- [ ] **Lovable Cloud enabled** for this project (so `LOVABLE_API_KEY` is auto-injected)  
- [ ] `ALLOWED_ORIGIN` set in Supabase if desired (e.g. `http://localhost:8080`)  
- [ ] `triage-evaluate` and `fetch-clinics` deployed  
- [ ] `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`  
- [ ] App runs and triage + clinic list use AI (no fallback message)
