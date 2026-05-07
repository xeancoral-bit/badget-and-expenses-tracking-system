import { supabase, getSupabaseAdmin } from './supabase';

// ─────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────

export async function getUser() {
    const admin = getSupabaseAdmin();
    
    try {
        // Try to get existing user
        const { data: users, error } = await admin
            .from('users')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Supabase Query Error:', error.message);
            
            // Critical RLS / Permission Check
            if (error.message.includes('row-level security') || error.message.includes('permission denied')) {
                console.error('🚨 ACTION REQUIRED: Row-Level Security (RLS) is blocking database access. Run "ALTER TABLE users DISABLE ROW LEVEL SECURITY;" in your Supabase SQL Editor.');
            }

            // If it's a network error/fetch failure, throw to be caught by the outer catch
            if (error.message.includes('fetch') || error.message.includes('network')) {
                throw new Error(error.message);
            }
            throw new Error(`getUser database error: ${error.message}`);
        }

        if (users && users.length > 0) {
            const user = users[0];
            // Ensure they have an account
            const { data: accounts } = await admin
                .from('accounts')
                .select('id')
                .eq('user_id', user.id)
                .limit(1);

            if (!accounts || accounts.length === 0) {
                await admin.from('accounts').insert({
                    user_id: user.id,
                    name: 'Main Account',
                    type: 'checking',
                    balance: 0,
                });
            }
            return user;
        }

        // Create default demo user if table is empty but reachable
        const { data: newUser, error: insertError } = await admin
            .from('users')
            .insert({ name: 'User', email: 'user@example.com' })
            .select()
            .single();

        if (insertError) {
            console.error('createUser error:', insertError.message);
            
            // If duplicate email, just fetch that user
            if (insertError.message.includes('unique constraint') || insertError.message.includes('already exists')) {
                const { data: existingUser } = await admin
                    .from('users')
                    .select('*')
                    .eq('email', 'user@example.com')
                    .single();
                if (existingUser) return existingUser;
            }
            throw new Error(`createUser error: ${insertError.message}`);
        }

        if (newUser) {
            await admin.from('accounts').insert({
                user_id: newUser.id,
                name: 'Main Account',
                type: 'checking',
                balance: 0,
            });
            return newUser;
        }
        
        throw new Error('Failed to retrieve or create user');

    } catch (err: any) {
        console.error('⚠️ DATABASE CONNECTIVITY CRITICAL:', err.message);
        
        // RESILIENT FALLBACK: Return a mock user so the app remains functional for demo purposes
        console.log('🔄 Engaging Offline/Demo Fallback Mode...');
        return {
            id: 999,
            name: 'User',
            email: 'user@example.com',
            created_at: new Date().toISOString(),
            is_mock: true
        };
    }
}

// ─────────────────────────────────────────────────────────────
// ACCOUNTS
// ─────────────────────────────────────────────────────────────

export async function getAccounts(userId: number) {
    try {
        const admin = getSupabaseAdmin();
        const { data, error } = await admin
            .from('accounts')
            .select('*')
            .eq('user_id', userId)
            .order('id', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (err: any) {
        console.error('getAccounts fallback:', err.message);
        if (userId === 999) {
            return [{ id: 1, name: 'Main Account', type: 'checking', balance: 0, user_id: 999 }];
        }
        return [];
    }
}

export async function getAccountById(id: number) {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error(`getAccountById error for id ${id}:`, error.message);
        return null;
    }
    return data;
}

export async function createAccount(userId: number, data: { name: string; type: string; balance: number }) {
    const admin = getSupabaseAdmin();
    const { data: account, error } = await admin
        .from('accounts')
        .insert({ user_id: userId, ...data })
        .select()
        .single();

    if (error) throw new Error(`createAccount error: ${error.message}`);
    return account;
}

export async function updateAccount(id: number, data: { name?: string; type?: string; balance?: number }) {
    const admin = getSupabaseAdmin();
    const { error } = await admin
        .from('accounts')
        .update(data)
        .eq('id', id);

    if (error) throw new Error(`updateAccount error: ${error.message}`);
}

export async function deleteAccount(id: number) {
    const admin = getSupabaseAdmin();
    const { error } = await admin
        .from('accounts')
        .delete()
        .eq('id', id);

    if (error) throw new Error(`deleteAccount error: ${error.message}`);
}

// ─────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────

export async function getCategories(type?: string) {
    const admin = getSupabaseAdmin();
    let query = admin.from('categories').select('*').order('name', { ascending: true });

    if (type) {
        query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw new Error(`getCategories error: ${error.message}`);
    return data || [];
}

export async function getCategoryById(id: number) {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

export function categorizeTransaction(description: string, type: 'income' | 'expense'): string {
    const lowerDesc = description.toLowerCase();

    const expenseKeywords: Record<string, string[]> = {
        'Food & Dining': ['food', 'meal', 'restaurant', 'lunch', 'dinner', 'breakfast', 'coffee', 'cafe', 'pizza', 'grocery', 'starbucks', 'mcdonalds', 'kfc', 'grabfood', 'foodpanda', 'jollibee', 'mcdo', 'bakery'],
        'Transportation': ['uber', 'lyft', 'gas', 'fuel', 'parking', 'taxi', 'car', 'transport', 'train', 'bus', 'metro', 'grab', 'angkas', 'joyride', 'petrol', 'diesel'],
        'Shopping': ['shop', 'store', 'mall', 'amazon', 'walmart', 'target', 'clothing', 'shoes', 'apple', 'nike', 'zara', 'shopee', 'lazada', 'tiktok shop'],
        'Bills & Utilities': ['bill', 'rent', 'electric', 'water', 'internet', 'phone', 'utility', 'insurance', 'tax', 'mortgage', 'meralco', 'pldt', 'globe', 'smart'],
        'Entertainment': ['movie', 'netflix', 'spotify', 'game', 'concert', 'entertainment', 'cinema', 'hulu', 'disney', 'steam', 'playstation', 'xbox'],
        'Health & Medical': ['doctor', 'pharmacy', 'hospital', 'medicine', 'health', 'medical', 'dentist', 'clinic', 'watsons', 'mercury drug'],
        'Education': ['book', 'course', 'school', 'education', 'learning', 'university', 'tuition', 'udemy', 'coursera'],
        'Groceries': ['grocery', 'supermarket', 'market', 'tesco', 'aldi', 'lidl', 'safeway', 'kroger', 'puregold', 'sm market', 'robinsons'],
    };

    const incomeKeywords: Record<string, string[]> = {
        'Salary': ['salary', 'paycheck', 'paid', 'payroll'],
        'Freelance': ['freelance', 'work', 'contract', 'gig', 'upwork', 'fiverr'],
        'Investments': ['investment', 'dividend', 'interest', 'return', 'stock', 'crypto'],
        'Business': ['business', 'revenue', 'profit', 'sales'],
    };

    const keywords = type === 'income' ? incomeKeywords : expenseKeywords;

    for (const [category, words] of Object.entries(keywords)) {
        if (words.some(word => lowerDesc.includes(word))) {
            return category;
        }
    }

    return type === 'income' ? 'Other Income' : 'Other Expenses';
}

// ─────────────────────────────────────────────────────────────
// TRANSACTIONS
// ─────────────────────────────────────────────────────────────

export async function getTransactions(
    userId: number,
    filters?: { accountId?: number; categoryId?: number; startDate?: string; endDate?: string; type?: string }
) {
    try {
        const admin = getSupabaseAdmin();
        let query = admin
            .from('transactions')
            .select(`
                *,
                categories ( name, icon, color ),
                accounts ( name )
            `)
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .order('id', { ascending: false });

        if (filters?.accountId)  query = query.eq('account_id', filters.accountId);
        if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
        if (filters?.startDate)  query = query.gte('date', filters.startDate);
        if (filters?.endDate)    query = query.lte('date', filters.endDate);
        if (filters?.type)       query = query.eq('type', filters.type);

        const { data, error } = await query;
        if (error) {
            console.error('getTransactions Error:', error.message);
            if (error.message.includes('row-level security') || error.message.includes('policy')) {
                return { error: `RLS policy blocked access. Run "ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;" in Supabase SQL Editor.` } as any;
            }
            throw error;
        }

        // Flatten joined fields to match what the UI expects
        return (data || []).map((t: any) => ({
            ...t,
            category_name:  t.categories?.name,
            category_icon:  t.categories?.icon,
            category_color: t.categories?.color,
            account_name:   t.accounts?.name,
            category: t.categories,
            account: t.accounts,
            categories: undefined,
            accounts: undefined,
        }));
    } catch (err: any) {
        console.error('getTransactions fallback:', err.message);
        return [];
    }
}

export async function createTransaction(
    userId: number,
    data: { account_id: number; category_id: number; amount: number; type: string; description: string; date: string }
) {
    const admin = getSupabaseAdmin();
    const { data: transaction, error } = await admin
        .from('transactions')
        .insert({ user_id: userId, ...data })
        .select()
        .single();

    if (error) {
        if (error.message.includes('row-level security') || error.message.includes('policy')) {
            throw new Error(`DATABASE_RLS_LOCKED: Row-Level Security is blocking this transaction. Please run "ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;" in your Supabase SQL Editor to enable AI auto-sync.`);
        }
        throw new Error(`createTransaction error: ${error.message}`);
    }

    // Update account balance
    const account = await getAccountById(data.account_id);
    if (account) {
        const newBalance = data.type === 'income'
            ? Number(account.balance) + Number(data.amount)
            : Number(account.balance) - Number(data.amount);
        await updateAccount(data.account_id, { balance: newBalance });
    }

    return transaction;
}

export async function updateTransaction(id: number, userId: number, data: any) {
    const admin = getSupabaseAdmin();
    // 1. Get the old transaction to adjust balance
    const { data: oldTransaction } = await admin
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

    const { data: transaction, error } = await admin
        .from('transactions')
        .update(data)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw new Error(`updateTransaction error: ${error.message}`);

    // 2. Update account balance if amount, type, or account changed
    if (oldTransaction && (data.amount !== undefined || data.type !== undefined || data.account_id !== undefined)) {
        // Revert old transaction effect
        const oldAccount = await getAccountById(oldTransaction.account_id);
        if (oldAccount) {
            const revertedBalance = oldTransaction.type === 'income'
                ? Number(oldAccount.balance) - Number(oldTransaction.amount)
                : Number(oldAccount.balance) + Number(oldTransaction.amount);
            await updateAccount(oldTransaction.account_id, { balance: revertedBalance });
        }

        // Apply new transaction effect
        const targetAccountId = data.account_id || oldTransaction.account_id;
        const newAccount = await getAccountById(targetAccountId);
        if (newAccount) {
            const newAmount = data.amount !== undefined ? data.amount : oldTransaction.amount;
            const newType = data.type !== undefined ? data.type : oldTransaction.type;
            
            const newBalance = newType === 'income'
                ? Number(newAccount.balance) + Number(newAmount)
                : Number(newAccount.balance) - Number(newAmount);
            await updateAccount(targetAccountId, { balance: newBalance });
        }
    }

    return transaction;
}

export async function deleteTransaction(id: number, userId: number) {
    const admin = getSupabaseAdmin();
    // 1. Get transaction details to adjust account balance
    const { data: transaction } = await admin
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

    if (transaction) {
        const account = await getAccountById(transaction.account_id);
        if (account) {
            // Reverse the transaction's effect on the balance
            const newBalance = transaction.type === 'income'
                ? Number(account.balance) - Number(transaction.amount)
                : Number(account.balance) + Number(transaction.amount);
            
            await updateAccount(transaction.account_id, { balance: newBalance });
        }
    }

    // 2. Delete the transaction
    const { error } = await admin
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) throw new Error(`deleteTransaction error: ${error.message}`);
    return true;
}

// ─────────────────────────────────────────────────────────────
// BUDGETS
// ─────────────────────────────────────────────────────────────

export async function getBudgets(userId: number) {
    try {
        const admin = getSupabaseAdmin();
        const { data: budgets, error } = await admin
            .from('budgets')
            .select(`
                *,
                categories ( name, icon, color )
            `)
            .eq('user_id', userId);

        if (error) throw error;

        // Get current month's expense transactions
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

        const { data: transactions } = await admin
            .from('transactions')
            .select('category_id, amount')
            .eq('user_id', userId)
            .eq('type', 'expense')
            .gte('date', startOfMonth);

        return (budgets || []).map((b: any) => {
            const spent = (transactions || [])
                .filter((t: any) => t.category_id === b.category_id)
                .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

            return {
                ...b,
                category_name:  b.categories?.name,
                category_icon:  b.categories?.icon,
                category_color: b.categories?.color,
                category: b.categories,
                categories: undefined,
                spent,
            };
        });
    } catch (err: any) {
        console.error('getBudgets fallback:', err.message);
        return [];
    }
}

export async function createBudget(
    userId: number,
    data: { category_id: number; amount: number; period: string; start_date: string }
) {
    const admin = getSupabaseAdmin();
    const { data: budget, error } = await admin
        .from('budgets')
        .insert({ user_id: userId, ...data })
        .select()
        .single();

    if (error) throw new Error(`createBudget error: ${error.message}`);
    return budget;
}

export async function updateBudget(id: number, data: any) {
    const admin = getSupabaseAdmin();
    const { error } = await admin
        .from('budgets')
        .update(data)
        .eq('id', id);

    if (error) throw new Error(`updateBudget error: ${error.message}`);
}

export async function deleteBudget(id: number) {
    const admin = getSupabaseAdmin();
    const { error } = await admin
        .from('budgets')
        .delete()
        .eq('id', id);

    if (error) throw new Error(`deleteBudget error: ${error.message}`);
}

// ─────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────

export async function getSpendingByCategory(userId: number) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const admin = getSupabaseAdmin();
    const { data: monthTransactions, error } = await admin
        .from('transactions')
        .select('amount, categories ( name, color )')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', startOfMonth);

    if (error) throw new Error(`getSpendingByCategory error: ${error.message}`);

    let transactionsToUse = monthTransactions || [];

    // All-time fallback if current month is empty
    if (transactionsToUse.length === 0) {
        const { data: allTransactions } = await admin
            .from('transactions')
            .select('amount, categories ( name, color )')
            .eq('user_id', userId)
            .eq('type', 'expense');
        transactionsToUse = allTransactions || [];
    }

    if (transactionsToUse.length === 0) return [];

    const categoryTotals: Record<string, { amount: number; color: string }> = {};
    let totalExpenses = 0;

    transactionsToUse.forEach((t: any) => {
        const categoryName = t.categories?.name || 'Uncategorized';
        const color = t.categories?.color || '#cbd5e1';
        const amount = Number(t.amount);

        if (!categoryTotals[categoryName]) {
            categoryTotals[categoryName] = { amount: 0, color };
        }
        categoryTotals[categoryName].amount += amount;
        totalExpenses += amount;
    });

    return Object.entries(categoryTotals)
        .map(([category, data]) => ({
            category,
            amount: data.amount,
            color: data.color,
            percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);
}

export async function getMonthlyTrends(userId: number, months: number = 6) {
    const admin = getSupabaseAdmin();
    const { data: transactions, error } = await admin
        .from('transactions')
        .select('amount, type, date')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error) throw new Error(`getMonthlyTrends error: ${error.message}`);
    if (!transactions || transactions.length === 0) return [];

    const monthData: Record<string, { month: string; income: number; expenses: number }> = {};

    // Initialize last N months
    for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().substring(0, 7);
        const monthName = date.toLocaleString('default', { month: 'short' });
        monthData[monthKey] = { month: monthName, income: 0, expenses: 0 };
    }

    transactions.forEach((t: any) => {
        const monthKey = t.date.substring(0, 7);
        if (monthData[monthKey]) {
            if (t.type === 'income') {
                monthData[monthKey].income += Number(t.amount);
            } else {
                monthData[monthKey].expenses += Number(t.amount);
            }
        }
    });

    return Object.values(monthData).reverse();
}

export async function getFinancialSummary(userId: number) {
    const admin = getSupabaseAdmin();
    try {
        // 1. Snapshot of current liquidity from accounts
        const { data: accounts } = await admin
            .from('accounts')
            .select('balance')
            .eq('user_id', userId);

        const totalBalance = (accounts || []).reduce((sum, a: any) => sum + Number(a.balance || 0), 0);

        // 2. All-time aggregates (Full history)
        const { data: allTrans } = await admin
            .from('transactions')
            .select('amount, type')
            .eq('user_id', userId);

        let allTimeIncome = 0;
        let allTimeExpenses = 0;
        (allTrans || []).forEach((t: any) => {
            const amt = Number(t.amount || 0);
            if (t.type === 'income') allTimeIncome += amt;
            else if (t.type === 'expense') allTimeExpenses += amt;
        });

        // 3. Savings Rate Logic (User requested it detect accurately)
        // If they mean all-time savings rate:
        const allTimeSavingsRate = allTimeIncome > 0 ? ((allTimeIncome - allTimeExpenses) / allTimeIncome) * 100 : 0;
        
        // Month specific aggregates
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        const { data: monthlyTrans } = await admin
            .from('transactions')
            .select('amount, type')
            .eq('user_id', userId)
            .gte('date', startOfMonth)
            .lte('date', endOfMonth);

        let monthlyIncome = 0;
        let monthlyExpenses = 0;

        (monthlyTrans || []).forEach((t: any) => {
            const amount = Number(t.amount || 0);
            if (t.type === 'income') monthlyIncome += amount;
            else if (t.type === 'expense') monthlyExpenses += amount;
        });
        
        const monthlySavingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

        return {
            totalBalance,
            totalIncome: monthlyIncome,
            totalExpenses: monthlyExpenses,
            allTimeIncome,
            allTimeExpenses,
            savingsRate: allTimeSavingsRate, // defaulting to all-time for "detect" clarity
            monthlySavingsRate,
            transactionsThisMonth: (monthlyTrans || []).length,
        };
    } catch (err) {
        console.error('getFinancialSummary error:', err);
        return { totalBalance: 0, totalIncome: 0, totalExpenses: 0, allTimeIncome: 0, allTimeExpenses: 0, savingsRate: 0, transactionsThisMonth: 0 };
    }
}

// ─────────────────────────────────────────────────────────────
// CHAT MESSAGES
// ─────────────────────────────────────────────────────────────

export async function addChatMessage(userId: number, role: string, content: string) {
    try {
        const admin = getSupabaseAdmin();
        const { data, error } = await admin
            .from('chat_messages')
            .insert({ user_id: userId, role, content })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err: any) {
        console.error('addChatMessage fallback:', err.message);
        return { id: Math.random(), user_id: userId, role, content, created_at: new Date().toISOString() };
    }
}

export async function getChatHistory(userId: number, limit: number = 50) {
    try {
        const admin = getSupabaseAdmin();
        const { data, error } = await admin
            .from('chat_messages')
            .select('*')
            .eq('user_id', userId)
            .order('id', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return (data || []).reverse();
    } catch (err: any) {
        console.error('getChatHistory fallback:', err.message);
        return [];
    }
}

// Legacy export — kept for compatibility
export default { supabase };
