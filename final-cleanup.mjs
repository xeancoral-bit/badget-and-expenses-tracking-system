
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function resetAndSeedCategories() {
    console.log('--- RESETTING AND SEEDING CATEGORIES ---');
    
    // 1. Fetch current categories to save their IDs
    const { data: currentCats } = await supabase.from('categories').select('*');
    if (!currentCats) return;

    // 2. Define the definitive list
    const definitiveCategories = [
        { name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#F59E0B' },
        { name: 'Transportation', type: 'expense', icon: 'car', color: '#3B82F6' },
        { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#EC4899' },
        { name: 'Bills & Utilities', type: 'expense', icon: 'zap', color: '#8B5CF6' },
        { name: 'Entertainment', type: 'expense', icon: 'film', color: '#10B981' },
        { name: 'Health & Medical', type: 'expense', icon: 'heart', color: '#EF4444' },
        { name: 'Education', type: 'expense', icon: 'book-open', color: '#06B6D4' },
        { name: 'Personal Care', type: 'expense', icon: 'user', color: '#F97316' },
        { name: 'Groceries', type: 'expense', icon: 'shopping-cart', color: '#84CC16' },
        { name: 'Other Expenses', type: 'expense', icon: 'more-horizontal', color: '#6B7280' },
        { name: 'Salary', type: 'income', icon: 'briefcase', color: '#10B981' },
        { name: 'Freelance', type: 'income', icon: 'laptop', color: '#3B82F6' },
        { name: 'Investments', type: 'income', icon: 'trending-up', color: '#8B5CF6' },
        { name: 'Business', type: 'income', icon: 'building', color: '#EC4899' },
        { name: 'Gifts', type: 'income', icon: 'gift', color: '#F59E0B' },
        { name: 'Other Income', type: 'income', icon: 'plus-circle', color: '#6B7280' }
    ];

    for (const defCat of definitiveCategories) {
        // Check if it already exists
        const existing = currentCats.find(c => c.name === defCat.name && c.type === defCat.type);
        
        if (!existing) {
            console.log(`Creating missing category: ${defCat.name}`);
            await supabase.from('categories').insert(defCat);
        } else {
            // It exists, now check for duplicates of THIS specific one
            const duplicates = currentCats.filter(c => c.name === defCat.name && c.type === defCat.type && c.id !== existing.id);
            if (duplicates.length > 0) {
                console.log(`Found ${duplicates.length} duplicates for: ${defCat.name}. Cleaning up...`);
                for (const dup of duplicates) {
                    // Update transactions/budgets to point to 'existing.id'
                    await supabase.from('transactions').update({ category_id: existing.id }).eq('category_id', dup.id);
                    await supabase.from('budgets').update({ category_id: existing.id }).eq('category_id', dup.id);
                    // Delete duplicate
                    await supabase.from('categories').delete().eq('id', dup.id);
                }
            }
        }
    }

    // Also clean up any categories NOT in the definitive list that are duplicates of each other
    const remainingCats = (await supabase.from('categories').select('*')).data || [];
    const seen = new Set();
    for (const cat of remainingCats) {
        const key = `${cat.name}-${cat.type}`;
        if (seen.has(key)) {
            console.log(`Cleaning up extra duplicate: ${cat.name}`);
            const primary = remainingCats.find(c => `${c.name}-${c.type}` === key);
            await supabase.from('transactions').update({ category_id: primary.id }).eq('category_id', cat.id);
            await supabase.from('budgets').update({ category_id: primary.id }).eq('category_id', cat.id);
            await supabase.from('categories').delete().eq('id', cat.id);
        } else {
            seen.add(key);
        }
    }

    console.log('--- DATABASE CLEANUP COMPLETE ---');
}

resetAndSeedCategories();
