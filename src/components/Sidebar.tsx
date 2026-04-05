'use client';

import React from 'react';
import {
    LayoutDashboard,
    CreditCard,
    PieChart,
    Target,
    MessageSquare,
    Wallet,
    TrendingUp
} from 'lucide-react';
import { useApp } from '@/lib/AppContext';

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
];

export default function Sidebar() {
    const { state, dispatch } = useApp();
    const { activeTab, accounts, summary, chatOpen } = state;

    const handleNavClick = (id: string) => {
        dispatch({ type: 'SET_ACTIVE_TAB', payload: id });
    };

    const toggleChat = () => {
        dispatch({ type: 'TOGGLE_CHAT' });
    };

    const getAccountIconClass = (type: string) => {
        if (type === 'checking') return 'bg-accent/20';
        if (type === 'savings') return 'bg-emerald-500/20';
        if (type === 'credit') return 'bg-warning/20';
        return 'bg-slate-500/20';
    };

    // Live "Auto-detection" logic - Derived directly from Transaction History
    const totalBalance = state.transactions.reduce((sum, t) => {
        return t.type === 'income' ? sum + Number(t.amount) : sum - Number(t.amount);
    }, 0);

    // Calculate current month's totals from the transaction list (Single Source of Truth)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentMonthTransactions = state.transactions.filter(t => {
        const [year, month, day] = t.date.split('-');
        const tDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return tDate >= startOfMonth;
    });

    const totalIncome = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalExpenses = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
                        <Wallet className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-text-primary transition-colors">SmartBudget</h1>
                        <p className="text-xs text-text-secondary font-medium transition-colors">AI-Powered Finance</p>
                    </div>
                </div>
            </div>

            <div className="p-5 mx-4 mb-4 bg-secondary rounded-2xl border border-border shadow-md">
                <div className="flex items-center justify-between mb-3 text-text-primary/90">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-black dark:text-black">Total Balance</span>
                    <TrendingUp className="text-emerald-500 opacity-80" size={16} />
                </div>
                <p className="text-2xl font-bold text-text-primary tracking-tight flex items-baseline gap-1">
                    <span className="text-text-muted text-lg font-medium">₱</span>
                    {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="mt-4 flex items-center gap-3 text-[11px] font-semibold">
                    <div className="flex items-center gap-1 text-emerald-600">
                        <span>₱{totalIncome.toLocaleString()}</span>
                        <span className="opacity-60 font-normal">in</span>
                    </div>
                    <span className="text-text-muted">|</span>
                    <div className="flex items-center gap-1 text-red-600">
                        <span>₱{totalExpenses.toLocaleString()}</span>
                        <span className="opacity-60 font-normal">out</span>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 px-2">Main Menu</p>
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => handleNavClick(item.id)}
                                    className={`nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                        ? 'bg-accent text-white shadow-lg shadow-accent/20 active'
                                        : 'text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>



            <div className={`p-4 mx-4 mb-4 border-t border-border`}>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Living Accounts</p>
                <ul className="space-y-3">
                    {accounts?.slice(0, 4)?.map((account) => {
                        const accountSpecificBalance = state.transactions
                            .filter(t => t.account_id === account.id)
                            .reduce((sum, t) => t.type === 'income' ? sum + Number(t.amount) : sum - Number(t.amount), 0);

                        return (
                            <li key={account.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${getAccountIconClass(account.type)}`}>
                                        <Wallet size={14} className="text-text-muted" />
                                    </div>
                                    <span className="text-xs font-semibold text-text-primary truncate">{account.name}</span>
                                </div>
                                <span className={`text-xs font-bold ${accountSpecificBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    ₱{accountSpecificBalance.toLocaleString()}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </aside>
    );
}
