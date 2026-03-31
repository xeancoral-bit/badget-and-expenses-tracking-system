'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { Account, Transaction, Budget, Category, FinancialSummary, SpendingByCategory, MonthlyTrend, AIInsight } from './types';

interface AppState {
    user: any;
    accounts: Account[];
    transactions: Transaction[];
    budgets: Budget[];
    categories: Category[];
    summary: FinancialSummary | null;
    spending: SpendingByCategory[];
    trends: MonthlyTrend[];
    insights: AIInsight[];
    isLoading: boolean;
    activeTab: string;
    chatOpen: boolean;
    chatMessages: { role: string; content: string }[];
    sidebarOpen: boolean;
    notifications: { id: number; message: string; type: 'success' | 'error' | 'info'; read: boolean; timestamp: Date }[];
    theme: 'light' | 'dark';
    showAddTransactionModal: boolean;
    showAddBudgetModal: boolean;
}

type AppAction =
    | { type: 'SET_USER'; payload: any }
    | { type: 'SET_ACCOUNTS'; payload: Account[] }
    | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
    | { type: 'SET_BUDGETS'; payload: Budget[] }
    | { type: 'SET_CATEGORIES'; payload: Category[] }
    | { type: 'SET_SUMMARY'; payload: FinancialSummary }
    | { type: 'SET_SPENDING'; payload: SpendingByCategory[] }
    | { type: 'SET_TRENDS'; payload: MonthlyTrend[] }
    | { type: 'SET_INSIGHTS'; payload: AIInsight[] }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ACTIVE_TAB'; payload: string }
    | { type: 'TOGGLE_CHAT' }
    | { type: 'SET_CHAT_MESSAGES'; payload: { role: string; content: string }[] }
    | { type: 'ADD_CHAT_MESSAGE'; payload: { role: string; content: string } }
    | { type: 'TOGGLE_SIDEBAR' }
    | { type: 'UPDATE_BALANCE'; payload: { accountId: number; amount: number; type: 'income' | 'expense' } }
    | { type: 'ADD_NOTIFICATION'; payload: { message: string; type: 'success' | 'error' | 'info' } }
    | { type: 'MARK_NOTIFICATION_READ'; payload: number }
    | { type: 'CLEAR_NOTIFICATIONS' }
    | { type: 'TOGGLE_THEME' }
    | { type: 'ADD_TRANSACTION_SHORTCUT' }
    | { type: 'ADD_BUDGET_SHORTCUT' }
    | { type: 'CLOSE_MODALS' };

const initialState: AppState = {
    user: null,
    accounts: [],
    transactions: [],
    budgets: [],
    categories: [],
    summary: null,
    spending: [],
    trends: [],
    insights: [],
    isLoading: true,
    activeTab: 'dashboard',
    chatOpen: false,
    chatMessages: [],
    sidebarOpen: true,
    notifications: [],
    theme: 'light',
    showAddTransactionModal: false,
    showAddBudgetModal: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, user: action.payload };
        case 'SET_ACCOUNTS':
            return { ...state, accounts: action.payload };
        case 'SET_TRANSACTIONS':
            return { ...state, transactions: action.payload };
        case 'SET_BUDGETS':
            return { ...state, budgets: action.payload };
        case 'SET_CATEGORIES':
            return { ...state, categories: action.payload };
        case 'SET_SUMMARY':
            return { ...state, summary: action.payload };
        case 'SET_SPENDING':
            return { ...state, spending: action.payload };
        case 'SET_TRENDS':
            return { ...state, trends: action.payload };
        case 'SET_INSIGHTS':
            return { ...state, insights: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ACTIVE_TAB':
            return { ...state, activeTab: action.payload };
        case 'TOGGLE_CHAT':
            return { ...state, chatOpen: !state.chatOpen };
        case 'TOGGLE_SIDEBAR':
            return { ...state, sidebarOpen: !state.sidebarOpen };
        case 'SET_CHAT_MESSAGES':
            return { ...state, chatMessages: action.payload };
        case 'ADD_CHAT_MESSAGE':
            return { ...state, chatMessages: [...state.chatMessages, action.payload] };
        case 'UPDATE_BALANCE':
            return {
                ...state,
                accounts: state.accounts.map(acc =>
                    acc.id === action.payload.accountId
                        ? {
                            ...acc,
                            balance: action.payload.type === 'income'
                                ? acc.balance + action.payload.amount
                                : acc.balance - action.payload.amount
                        }
                        : acc
                ),
            };
        case 'ADD_NOTIFICATION':
            return {
                ...state,
                notifications: [
                    ...state.notifications,
                    {
                        id: Date.now(),
                        message: action.payload.message,
                        type: action.payload.type,
                        read: false,
                        timestamp: new Date()
                    }
                ]
            };
        case 'MARK_NOTIFICATION_READ':
            return {
                ...state,
                notifications: state.notifications.map(n =>
                    n.id === action.payload ? { ...n, read: true } : n
                )
            };
        case 'CLEAR_NOTIFICATIONS':
            return {
                ...state,
                notifications: []
            };
        case 'TOGGLE_THEME':
            return {
                ...state,
                theme: state.theme === 'light' ? 'dark' : 'light'
            };
        case 'ADD_TRANSACTION_SHORTCUT':
            return {
                ...state,
                activeTab: 'transactions',
                showAddTransactionModal: true
            };
        case 'ADD_BUDGET_SHORTCUT':
            return {
                ...state,
                activeTab: 'budgets',
                showAddBudgetModal: true
            };
        case 'CLOSE_MODALS':
            return {
                ...state,
                showAddTransactionModal: false,
                showAddBudgetModal: false
            };
        default:
            return state;
    }
}

interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
    refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    const refreshData = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            const [userRes, accountsRes, transactionsRes, budgetsRes, categoriesRes, summaryRes, spendingRes, trendsRes, insightsRes, chatRes] = await Promise.all([
                fetch('/api/user').then(r => r.json()).catch(() => ({})),
                fetch('/api/accounts').then(r => r.json()).catch(() => []),
                fetch('/api/transactions').then(r => r.json()).catch(() => []),
                fetch('/api/budgets').then(r => r.json()).catch(() => []),
                fetch('/api/categories').then(r => r.json()).catch(() => []),
                fetch('/api/analytics/summary').then(r => r.json()).catch(() => ({})),
                fetch('/api/analytics/spending').then(r => r.json()).catch(() => []),
                fetch('/api/analytics/trends').then(r => r.json()).catch(() => []),
                fetch('/api/insights').then(r => r.json()).catch(() => []),
                fetch('/api/chat').then(r => r.json()).catch(() => [])
            ]);

            if (userRes && !userRes.error) dispatch({ type: 'SET_USER', payload: userRes });
            if (Array.isArray(accountsRes)) dispatch({ type: 'SET_ACCOUNTS', payload: accountsRes });
            if (Array.isArray(transactionsRes)) dispatch({ type: 'SET_TRANSACTIONS', payload: transactionsRes });
            if (Array.isArray(budgetsRes)) dispatch({ type: 'SET_BUDGETS', payload: budgetsRes });
            if (Array.isArray(categoriesRes)) dispatch({ type: 'SET_CATEGORIES', payload: categoriesRes });
            if (summaryRes && !summaryRes.error) dispatch({ type: 'SET_SUMMARY', payload: summaryRes });
            if (Array.isArray(spendingRes)) dispatch({ type: 'SET_SPENDING', payload: spendingRes });
            if (Array.isArray(trendsRes)) dispatch({ type: 'SET_TRENDS', payload: trendsRes });
            if (Array.isArray(insightsRes)) dispatch({ type: 'SET_INSIGHTS', payload: insightsRes });
            if (Array.isArray(chatRes)) dispatch({ type: 'SET_CHAT_MESSAGES', payload: chatRes });
        } catch (error) {
            console.error('Failed to refresh data:', error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    return (
        <AppContext.Provider value={{ state, dispatch, refreshData }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
