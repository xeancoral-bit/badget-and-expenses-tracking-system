
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
s.from('users').select('*').then(r => console.log('Users:', r.data));
s.from('accounts').select('*').then(r => console.log('Accounts:', r.data));
s.from('transactions').select('*').then(r => console.log('Transactions:', r.data));
