import { createClient } from '@supabase/supabase-js';

// Ultimate Activation: Using provided keys as a persistent fallback for your deployment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hxwjjrpekjptvdkqjnaf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Ql-KlsQ3WhXrSrqkMENFbA_X3Woz4dM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Administrative client for server-side AI processing.
 * Using provided Service Role Key as a hard fallback.
 */
export const getSupabaseAdmin = () => {
    // If service role key is missing or a placeholder, fallback to anon key for development
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder_update_this_manually') 
        ? process.env.SUPABASE_SERVICE_ROLE_KEY 
        : supabaseAnonKey;
    
    // Safety check for critical admin operations
    if (serviceRoleKey === 'placeholder-key' && process.env.NODE_ENV === 'production') {
        console.error('Critical Error: AI Master Key is missing in production!');
    }
    
    return createClient(supabaseUrl, serviceRoleKey);
};
