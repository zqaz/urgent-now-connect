# Demo Account

When the app **cannot reach Supabase** (e.g. no `.env` or placeholder URL), you can use **demo mode** so the app still works:

- In the Create account / Sign in modal, if you see *"We can't reach the server right now"*, click **Continue as demo user**. You’ll be signed in as a demo user and your profile is stored in localStorage (see `docs/PROFILE_AND_INSURANCE_SETUP.md`).

**Dummy credentials** (for when Supabase **is** configured and you want a test account):

| Field    | Value              |
|----------|--------------------|
| Email    | `demo@urgentnow.app` |
| Password | `DemoPassword1!`     |

Password meets all rules: 12+ characters, uppercase, lowercase, number, special character.

- In the auth modal, click **Use demo account** to fill these in, then Sign In or Create Account (create the account once in your Supabase project if needed).
