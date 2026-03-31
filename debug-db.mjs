
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debug() {
    console.log('--- SYSTEM STATUS ---');
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) {
        console.error('Error fetching users:', error);
        return;
    }
    if (!users || users.length === 0) {
        console.log('No users found in database.');
        return;
    }
    const user = users[0];
    console.log(`Current User: ${user.id} | ${user.name}`);

    const { data: accounts } = await supabase.from('accounts').select('*').eq('user_id', user.id);
    console.log('Accounts:', accounts);

    const { data: transactions } = await supabase.from('transactions').select('*').eq('user_id', user.id);
    console.log('All Transactions:', transactions);

    const { data: chat } = await supabase.from('chat_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
    console.log('Recent Chat:', chat?.map(c => `[${c.role}] ${c.content}`));
}

debug();
