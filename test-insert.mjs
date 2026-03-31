
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
    console.log('Testing manual insert...');
    const { data: users } = await supabase.from('users').select('*').limit(1);
    const userId = users[0].id;

    const { data: accounts } = await supabase.from('accounts').select('*').eq('user_id', userId).limit(1);
    const accountId = accounts[0].id;

    const { data: categories } = await supabase.from('categories').select('*').eq('type', 'income').limit(1);
    const categoryId = categories[0].id;

    const txData = {
        user_id: userId,
        account_id: accountId,
        category_id: categoryId,
        amount: 100,
        type: 'income',
        description: 'Manual Test Insert',
        date: new Date().toISOString().split('T')[0]
    };

    const { data, error } = await supabase.from('transactions').insert([txData]).select();
    if (error) {
        console.error('Insert failed:', error);
    } else {
        console.log('Insert success:', data);

        const { data: all } = await supabase.from('transactions').select('*');
        console.log('Verify all transactions:', all);
    }
}

testInsert();
