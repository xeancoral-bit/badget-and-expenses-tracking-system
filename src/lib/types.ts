// Type definitions for the budget tracking system

export interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

export interface Account {
    id: number;
    user_id: number;
    name: string;
    type: 'checking' | 'savings' | 'credit' | 'cash';
    balance: number;
    created_at: string;
}

export interface Category {
    id: number;
    name: string;
    type: 'income' | 'expense';
    icon: string;
    color: string;
}

export interface Transaction {
    id: number;
    user_id: number;
    account_id: number;
    category_id: number;
    amount: number;
    type: 'income' | 'expense';
    description: string;
    date: string;
    created_at: string;
    category?: Category;
    account?: Account;
}

export interface Budget {
    id: number;
    user_id: number;
    category_id: number;
    amount: number;
    period: 'monthly' | 'weekly';
    start_date: string;
    created_at: string;
    category?: Category;
    spent?: number;
}

export interface ChatMessage {
    id: number;
    user_id: number;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export interface FinancialSummary {
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
    savingsRate: number;
    transactionsThisMonth: number;
}

export interface SpendingByCategory {
    category: string;
    amount: number;
    color: string;
    percentage: number;
}

export interface MonthlyTrend {
    month: string;
    income: number;
    expenses: number;
}

export interface AIInsight {
    id: string;
    type: 'warning' | 'suggestion' | 'info';
    title: string;
    description: string;
    category?: string;
}

// Form types
export interface TransactionFormData {
    account_id: number;
    amount: number;
    type: 'income' | 'expense';
    description: string;
    category_id: number;
    date: string;
}

export interface AccountFormData {
    name: string;
    type: 'checking' | 'savings' | 'credit' | 'cash';
    balance: number;
}

export interface BudgetFormData {
    category_id: number;
    amount: number;
    period: 'monthly' | 'weekly';
    start_date: string;
}

export interface ChatFormData {
    message: string;
}
