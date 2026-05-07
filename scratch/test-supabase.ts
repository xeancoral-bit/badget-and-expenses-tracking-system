import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Testing connection to:', supabaseUrl);
console.log('Using Key:', supabaseAnonKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    try {
        const { data, error } = await supabase.from('categories').select('*').limit(1);
        if (error) {
            console.error('❌ Connection Failed:', error.message);
        } else {
            console.log('✅ Connection Successful!');
            console.log('Data sample:', data);
        }
    } catch (err: any) {
        console.error('💥 Error:', err.message);
    }
}

test();
