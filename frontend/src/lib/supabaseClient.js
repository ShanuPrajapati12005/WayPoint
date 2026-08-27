import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    'Supabase URL or Publishable Key is missing. Ensure VITE_SUPABASE_URL and ' +
    'VITE_SUPABASE_PUBLISHABLE_KEY are set in your .env file for Phase 3 integration.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabasePublishableKey || '');
