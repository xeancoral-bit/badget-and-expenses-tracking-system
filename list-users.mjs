
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function list() {
    const { data: cats } = await supabase.from('categories').select('*');
    console.log('Categories:', JSON.stringify(cats, null, 2));
}

list();
