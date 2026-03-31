
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testSingle() {
    const userId = 1;
    const { data: accounts } = await s.from('accounts').select('*').limit(1);
    const { data: cats } = await s.from('categories').select('*').limit(1);

    const txData = {
        user_id: userId,
        account_id: accounts[0].id,
        category_id: cats[0].id,
        amount: 5,
        type: 'expense',
        description: 'Single Test',
        date: '2026-03-11'
    };

    console.log('Testing .single() insert...');
    const result = await s.from('transactions').insert([txData]).select().single();
    console.log('Result:', result);
}

testSingle();
