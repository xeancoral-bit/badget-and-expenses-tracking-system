
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugCategories() {
    console.log('--- FETCHING ALL CATEGORIES ---');
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) {
        console.error(error);
        return;
    }
    console.log('Total Categories:', data.length);
    data.forEach(c => {
        console.log(`[${c.id}] ${c.name} (${c.type})`);
    });
}

debugCategories();
