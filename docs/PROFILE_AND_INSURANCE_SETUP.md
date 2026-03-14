# Profile & Insurance Setup (In-App Reference)

Use this when adding or changing profile/insurance behavior in this app.

---

## 1. Setup "Prompt" (Spec to Follow)

- **Profile** stores: `id`, `name`, `date_of_birth`, `insurance_id`, `blood_type`, `allergies`, `medications`, `conditions`, `emergency_contact_name`, `emergency_contact_phone`, `notes`, `updated_at`.
- **Insurance** is a single field: `insurance_id` (string) from a fixed list of option IDs (e.g. `premera`, `regence`, `kaiser`, `aetna`, `cigna`, `united`, `molina`, `medicare`, `medicaid`, `self_pay`).
- **Insurance options** live in `src/data/insuranceData.ts`: `INSURANCE_OPTIONS` (id, name, shortName, color, textColor) and `PROVIDER_INSURANCE_MAP` (which providers accept which insurance IDs) for in/out of network badges.
- **Storage**: Supabase `public.profiles` (preferred). If the table is missing, fall back to localStorage so the app still works.
- **UX**: If `profile.insurance_id` is set, auto-skip the insurance picker and use it; otherwise show the picker and optionally save the selection to profile.

---

## 2. How We Store It

| Layer | Where | What |
|-------|--------|------|
| **DB** | `public.profiles` (Supabase) | Column `insurance_id` (TEXT). Row key = `auth.users(id)`. RLS: user can only read/write own row. |
| **Migration** | `supabase/migrations/20260311000000_create_profiles.sql` | Creates `profiles` table, RLS, triggers (updated_at, auto-create row on signup). |
| **Fallback** | `src/hooks/useProfile.ts` | If table missing/error → **localStorage** key `un_profile_${user.id}`, value = full profile JSON (includes `insurance_id`). |

All profile read/write goes through `useProfile`; it chooses DB vs localStorage based on whether the `profiles` table exists.

---

## 3. How We Use Dummy Data in the Profile

- **Demo profile** is defined in `src/hooks/useProfile.ts`: `makeDemoProfile(id)`.
  - Example: name "Alex Johnson", DOB, `insurance_id: "premera"`, blood type, allergies, medications, conditions, emergency contact, notes.
- **When it's used**
  - When the **profiles table is missing** (or Supabase returns a table-missing error): we use localStorage and seed with `loadLocalProfile(user.id) ?? makeDemoProfile(user.id)` so first-time users see a realistic demo profile.
  - In **local mode**, any save uses the same base: `loadLocalProfile(user.id) ?? makeDemoProfile(user.id)`, then applies updates and writes back to localStorage.
- **When DB exists**: New users get `makeEmptyProfile(user.id)` (all nulls); demo data is not used.

So: dummy data is only used in fallback/local mode to prefill the profile and localStorage.

---

## 4. Key Files in This App

| Purpose | File |
|--------|------|
| Insurance options + provider→insurance map | `src/data/insuranceData.ts` |
| Profile fetch/save, localStorage fallback, demo + empty profile | `src/hooks/useProfile.ts` |
| Profile UI (including insurance dropdown) | `src/components/ProfileModal.tsx` |
| Using saved insurance to skip picker | `src/pages/Index.tsx` (`profile?.insurance_id`, `setSelectedInsurance`, skip `insurance_select`) |
| DB schema | `supabase/migrations/20260311000000_create_profiles.sql` |

When you add a new flow that needs profile or insurance in this same app, follow this spec and reuse these files.
