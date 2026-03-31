
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
    console.log('Testing insert into users...');
    const { data, error } = await supabase
        .from('users')
        .insert([{ name: 'Test User', email: 'test-' + Date.now() + '@example.com' }])
        .select()
        .single();

    if (error) {
        console.error('Insert error:', error);
    } else {
        console.log('Insert success:', data);
    }
}

testInsert();
