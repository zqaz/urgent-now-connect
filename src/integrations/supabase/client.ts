import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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
