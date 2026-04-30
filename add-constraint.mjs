
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addConstraint() {
    console.log('--- Adding Unique Constraint to Categories ---');
    
    const { error } = await supabase.rpc('execute_sql', { 
        sql_query: 'ALTER TABLE categories ADD CONSTRAINT categories_name_type_unique UNIQUE (name, type);' 
    });

    if (error) {
        // If RPC fails, try raw query if possible, but Supabase JS doesn't have raw query.
        // We'll just rely on the deduplication script for now.
        console.error('Error adding constraint via RPC:', error.message);
        console.log('Falling back to deduplication script logic only.');
    } else {
        console.log('Successfully added unique constraint.');
    }
}

addConstraint();
