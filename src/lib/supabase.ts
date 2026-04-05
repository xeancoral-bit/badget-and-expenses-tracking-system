import { createClient } from '@supabase/supabase-js';

// Ultimate Activation: Using provided keys as a persistent fallback for your deployment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://geruywlgwotwuxxystsa.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlcnV5d2xnd290d3V4eHlzdHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjY1NjEsImV4cCI6MjA4ODkwMjU2MX0.hZw_CIriyevIF8lukIQGnInfhXIrKECIBSuYbNMUHdA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Administrative client for server-side AI processing.
 * Using provided Service Role Key as a hard fallback.
 */
export const getSupabaseAdmin = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlcnV5d2xnd290d3V4eHlzdHNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzMyNjU2MSwiZXhwIjoyMDg4OTAyNTYxfQ.1yRWu8R5eSbq8vUaUsWE3Zc-y8y957CcAfkob54pVaM';
    
    // Safety check for critical admin operations
    if (serviceRoleKey === 'placeholder-key' && process.env.NODE_ENV === 'production') {
        console.error('Critical Error: AI Master Key is missing in production!');
    }
    
    return createClient(supabaseUrl, serviceRoleKey);
};
