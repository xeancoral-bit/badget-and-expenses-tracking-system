
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deduplicateCategories() {
    console.log('--- Deduplicating Categories ---');
    
    // 1. Get all categories
    const { data: allCats } = await supabase.from('categories').select('*');
    if (!allCats) return;

    const seen = new Set();
    const duplicates = [];
    const uniqueMap = new Map();

    for (const cat of allCats) {
        const key = `${cat.name}-${cat.type}`;
        if (seen.has(key)) {
            duplicates.push(cat.id);
        } else {
            seen.add(key);
            uniqueMap.set(key, cat.id);
        }
    }

    if (duplicates.length === 0) {
        console.log('No duplicates found.');
        return;
    }

    console.log(`Found ${duplicates.length} duplicate categories. Deleting...`);

    // 2. Before deleting, we MUST update any transactions/budgets that point to these duplicates
    // But this is a complex task if we don't know which one to point to.
    // Let's just point them to the first unique one we found for that name.
    
    for (const cat of allCats) {
        const key = `${cat.name}-${cat.type}`;
        const correctId = uniqueMap.get(key);
        if (cat.id !== correctId) {
            // Update transactions
            await supabase.from('transactions').update({ category_id: correctId }).eq('category_id', cat.id);
            // Update budgets
            await supabase.from('budgets').update({ category_id: correctId }).eq('category_id', cat.id);
        }
    }

    // 3. Delete duplicates
    const { error } = await supabase.from('categories').delete().in('id', duplicates);
    
    if (error) {
        console.error('Error deleting duplicates:', error.message);
    } else {
        console.log('Successfully deleted duplicates.');
    }
}

deduplicateCategories();
