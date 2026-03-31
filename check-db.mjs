
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log('--- DB Check Detailed ---');
    const { data: users } = await supabase.from('users').select('*');
    if (!users || users.length === 0) {
        console.log('No users found.');
        return;
    }
    const userId = users[0].id;
    console.log('User ID:', userId);

    const { data: accounts } = await supabase.from('accounts').select('*').eq('user_id', userId);
    console.log('Accounts:', accounts);

    const { data: txs } = await supabase.from('transactions').select('*').eq('user_id', userId);
    console.log('Transactions:', txs?.map(t => `${t.date} | ${t.type} | ${t.amount} | ${t.description}`));

    const { data: categories } = await supabase.from('categories').select('*');
    console.log('Categories Count:', categories?.length);
}

check();
