
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkConstraints() {
    console.log('--- CHECKING CONSTRAINTS ---');
    const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: "SELECT conname FROM pg_constraint WHERE conrelid = 'categories'::regclass;"
    });
    if (error) {
        console.log('RPC failed (as expected if execute_sql is missing).');
        return;
    }
    console.log(data);
}

checkConstraints();
