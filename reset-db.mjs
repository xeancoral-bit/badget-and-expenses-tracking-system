
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function reset() {
    console.log('--- RESETTING DATABASE TO CLEAN STATE ---');
    const { data: users } = await supabase.from('users').select('*');
    if (!users || users.length === 0) return;

    for (const user of users) {
        console.log(`Cleaning user ${user.id} (${user.email})...`);

        // Delete transactions
        const { error: txErr } = await supabase.from('transactions').delete().eq('user_id', user.id);
        if (txErr) console.error('Error deleting transactions:', txErr);

        // Delete chat messages
        await supabase.from('chat_messages').delete().eq('user_id', user.id);

        // Reset balances
        const { error: accErr } = await supabase.from('accounts').update({ balance: 0 }).eq('user_id', user.id);
        if (accErr) console.error('Error resetting accounts:', accErr);
    }

    console.log('Database cleaned and reset to $0.00.');
}

reset();
