import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────

export async function getUser() {
    // 1. Proactive Environment Check
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration is missing (URL or Anon Key). Please check your environment variables.');
    }

    // Try to get existing user
    let users, error;
    try {
        const result = await supabase
            .from('users')
            .select('*')
            .limit(1);
        users = result.data;
        error = result.error;
    } catch (networkError: any) {
        console.error('Critical Network Failure in local getUser:', networkError);
        throw new Error(`getUser error: Network or Fetch Failure. This usually means the Supabase URL is incorrect or inaccessible. (${networkError.message})`);
    }

    if (error) throw new Error(`getUser error: ${error.message}`);

    if (users && users.length > 0) {
        // Make sure they have at least one account
        const { data: accounts } = await supabase
            .from('accounts')
            .select('id')
            .eq('user_id', users[0].id)
            .limit(1);

        if (!accounts || accounts.length === 0) {
            await supabase.from('accounts').insert({
                user_id: users[0].id,
                name: 'Main Account',
                type: 'checking',
                balance: 0,
            });
        }
        return users[0];
    }

    // Create default demo user
    const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({ name: 'Demo User', email: 'demo@example.com' })
        .select()
        .single();

    if (insertError) throw new Error(`createUser error: ${insertError.message}`);

    // Create default account
    await supabase.from('accounts').insert({
        user_id: newUser.id,
        name: 'Main Account',
        type: 'checking',
        balance: 0,
    });

    return newUser;
}

// ─────────────────────────────────────────────────────────────
// ACCOUNTS
// ─────────────────────────────────────────────────────────────

export async function getAccounts(userId: number) {
    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) throw new Error(`getAccounts error: ${error.message}`);
    return data || [];
}

export async function getAccountById(id: number) {
    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

export async function createAccount(userId: number, data: { name: string; type: string; balance: number }) {
    const { data: account, error } = await supabase
        .from('accounts')
        .insert({ user_id: userId, ...data })
        .select()
        .single();

    if (error) throw new Error(`createAccount error: ${error.message}`);
    return account;
}

export async function updateAccount(id: number, data: { name?: string; type?: string; balance?: number }) {
    const { error } = await supabase
        .from('accounts')
        .update(data)
        .eq('id', id);

    if (error) throw new Error(`updateAccount error: ${error.message}`);
}

export async function deleteAccount(id: number) {
    const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

    if (error) throw new Error(`deleteAccount error: ${error.message}`);
}

// ─────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────

export async function getCategories(type?: string) {
    let query = supabase.from('categories').select('*').order('name', { ascending: true });

    if (type) {
        query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw new Error(`getCategories error: ${error.message}`);
    return data || [];
}

export async function getCategoryById(id: number) {
    const { data, error } = await supabase
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
    let query = supabase
        .from('transactions')
        .select(`
            *,
            categories ( name, icon, color ),
            accounts ( name )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

    if (filters?.accountId)  query = query.eq('account_id', filters.accountId);
    if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters?.startDate)  query = query.gte('date', filters.startDate);
    if (filters?.endDate)    query = query.lte('date', filters.endDate);
    if (filters?.type)       query = query.eq('type', filters.type);

    const { data, error } = await query;
    if (error) throw new Error(`getTransactions error: ${error.message}`);

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
}

export async function createTransaction(
    userId: number,
    data: { account_id: number; category_id: number; amount: number; type: string; description: string; date: string }
) {
    const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({ user_id: userId, ...data })
        .select()
        .single();

    if (error) throw new Error(`createTransaction error: ${error.message}`);

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
    // 1. Get the old transaction to adjust balance
    const { data: oldTransaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

    const { data: transaction, error } = await supabase
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
    // 1. Get transaction details to adjust account balance
    const { data: transaction } = await supabase
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
    const { error } = await supabase
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
    const { data: budgets, error } = await supabase
        .from('budgets')
        .select(`
            *,
            categories ( name, icon, color )
        `)
        .eq('user_id', userId);

    if (error) throw new Error(`getBudgets error: ${error.message}`);

    // Get current month's expense transactions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const { data: transactions } = await supabase
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
}

export async function createBudget(
    userId: number,
    data: { category_id: number; amount: number; period: string; start_date: string }
) {
    const { data: budget, error } = await supabase
        .from('budgets')
        .insert({ user_id: userId, ...data })
        .select()
        .single();

    if (error) throw new Error(`createBudget error: ${error.message}`);
    return budget;
}

export async function updateBudget(id: number, data: any) {
    const { error } = await supabase
        .from('budgets')
        .update(data)
        .eq('id', id);

    if (error) throw new Error(`updateBudget error: ${error.message}`);
}

export async function deleteBudget(id: number) {
    const { error } = await supabase
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

    const { data: monthTransactions, error } = await supabase
        .from('transactions')
        .select('amount, categories ( name, color )')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', startOfMonth);

    if (error) throw new Error(`getSpendingByCategory error: ${error.message}`);

    let transactionsToUse = monthTransactions || [];

    // All-time fallback if current month is empty
    if (transactionsToUse.length === 0) {
        const { data: allTransactions } = await supabase
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
    const { data: transactions, error } = await supabase
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
    try {
        const { data: accounts } = await supabase
            .from('accounts')
            .select('balance')
            .eq('user_id', userId);

        const { data: allTransactions } = await supabase
            .from('transactions')
            .select('amount, type')
            .eq('user_id', userId);

        const totalBalance = (allTransactions || []).reduce((sum, t: any) => {
            return t.type === 'income' ? sum + Number(t.amount) : sum - Number(t.amount);
        }, 0);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        const { data: transactions } = await supabase
            .from('transactions')
            .select('amount, type')
            .eq('user_id', userId)
            .gte('date', startOfMonth)
            .lte('date', endOfMonth);

        let totalIncome = 0;
        let totalExpenses = 0;

        (transactions || []).forEach((t: any) => {
            const amount = Number(t.amount || 0);
            if (t.type === 'income') totalIncome += amount;
            else if (t.type === 'expense') totalExpenses += amount;
        });

        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

        return {
            totalBalance,
            totalIncome,
            totalExpenses,
            savingsRate,
            transactionsThisMonth: (transactions || []).length,
        };
    } catch (err) {
        console.error('getFinancialSummary error:', err);
        return { totalBalance: 0, totalIncome: 0, totalExpenses: 0, savingsRate: 0, transactionsThisMonth: 0 };
    }
}

// ─────────────────────────────────────────────────────────────
// CHAT MESSAGES
// ─────────────────────────────────────────────────────────────

export async function addChatMessage(userId: number, role: string, content: string) {
    const { data, error } = await supabase
        .from('chat_messages')
        .insert({ user_id: userId, role, content })
        .select()
        .single();

    if (error) throw new Error(`addChatMessage error: ${error.message}`);
    return data;
}

export async function getChatHistory(userId: number, limit: number = 50) {
    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw new Error(`getChatHistory error: ${error.message}`);
    return (data || []).reverse();
}

// Legacy export — kept for compatibility
export default { supabase };
