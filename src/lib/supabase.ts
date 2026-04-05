import { createClient } from '@supabase/supabase-js';

// This is the standard client for public/client-side access (uses ANON KEY)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// This is the administrative client for server-side only (uses SERVICE ROLE KEY) 
// Only ever use this in API routes or non-client files!
export const getSupabaseAdmin = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to anon key.');
        return supabase;
    }
    return createClient(supabaseUrl, serviceRoleKey);
};
