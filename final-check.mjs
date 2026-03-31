
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTxs() {
    console.log('Fetching ALL transactions from DB...');
    const { data, error } = await supabase.from('transactions').select('*');
    if (error) console.error(error);
    console.log('Result:', data);

    console.log('Fetching ALL accounts from DB...');
    const { data: accounts } = await supabase.from('accounts').select('*');
    console.log('Accounts:', accounts);
}

checkTxs();
