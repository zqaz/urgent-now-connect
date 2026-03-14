import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use placeholders when .env is missing so the app still loads; Supabase calls will fail and app uses mock data
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'placeholder-anon-key';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // sessionStorage clears the JWT when the tab/browser closes.
    // This prevents indefinite session persistence on shared or unattended devices,
    // which is required by HIPAA Technical Safeguards (45 CFR §164.312(a)(2)(iii)).
    storage: sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
