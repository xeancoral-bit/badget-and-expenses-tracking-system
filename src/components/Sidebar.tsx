'use client';

import React from 'react';
import {
    LayoutDashboard,
    CreditCard,
    PieChart,
    Target,
    MessageSquare,
    Wallet,
    TrendingUp,
    X
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
    const { activeTab, accounts, summary, chatOpen, isLoading, sidebarOpen } = state;

    const handleNavClick = (id: string) => {
        dispatch({ type: 'SET_ACTIVE_TAB', payload: id });
        // Close sidebar on mobile after navigation
        if (window.innerWidth < 1024) {
            dispatch({ type: 'TOGGLE_SIDEBAR' });
        }
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
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const currentMonthTransactions = state.transactions.filter(t => t.date >= startOfMonth);

    const totalIncome = state.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalExpenses = state.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const isDark = state.theme === 'dark';

    return (
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-logo flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
                        <Wallet className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-black text-text-primary tracking-tight">SmartBudget</h1>
                        <p className="text-[9px] md:text-[10px] font-bold text-accent uppercase tracking-[0.2em]">AI Strategic</p>
                    </div>
                </div>
                
                {/* Close button for mobile */}
                <button 
                    onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
                    className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Financial Overview - Live Connection to AI State */}
            <div className="p-5 mx-4 mb-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-text-muted">Net Worth</span>
                    {isLoading ? (
                        <div className="flex items-center gap-1.5 bg-accent/10 px-2 py-0.5 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                            <span className="text-[8px] font-black text-accent uppercase tracking-tighter">Syncing...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Live</span>
                        </div>
                    )}
                </div>
                    <div className={`mt-8 p-6 rounded-3xl border transition-all duration-500
                    ${isDark 
                        ? 'bg-charcoal-tertiary/40 border-charcoal-accent/20 shadow-xl' 
                        : 'bg-slate-50 border-black/5 shadow-inner'
                    }`}>
                    <div className="flex items-center justify-between mb-6">
                        <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-charcoal-text-muted' : 'text-slate-400'}`}>Financial Summary</h4>
                        <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-accent animate-ping' : 'bg-emerald-500'}`} />
                    </div>
                    
                    <div className="space-y-5">
                        <div className="flex justify-between items-center group">
                            <span className={`text-xs font-bold ${isDark ? 'text-charcoal-text-muted' : 'text-slate-500'}`}>Income</span>
                            <span className="text-sm font-black text-emerald-500 tracking-tighter group-hover:scale-110 transition-transform">
                                ₱{totalIncome.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center group">
                            <span className={`text-xs font-bold ${isDark ? 'text-charcoal-text-muted' : 'text-slate-500'}`}>Expenses</span>
                            <span className="text-sm font-black text-red-500 tracking-tighter group-hover:scale-110 transition-transform">
                                ₱{totalExpenses.toLocaleString()}
                            </span>
                        </div>
                        <div className={`h-px w-full my-4 ${isDark ? 'bg-charcoal-border' : 'bg-black/5'}`} />
                        <div className="flex justify-between items-center">
                            <span className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-charcoal-text-primary' : 'text-black'}`}>Balance</span>
                            <span className={`text-lg font-black tracking-tighter ${totalBalance >= 0 ? (isDark ? 'text-charcoal-accent' : 'text-black') : 'text-red-600'}`}>
                                ₱{totalBalance.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className={`mt-6 p-3 rounded-2xl flex items-center gap-3
                        ${isDark ? 'bg-charcoal-accent/10' : 'bg-black/5'}`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-charcoal-accent/20' : 'bg-black/10'}`}>
                            <TrendingUp size={16} className={isDark ? 'text-charcoal-accent' : 'text-black'} />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[9px] font-black uppercase tracking-tighter ${isDark ? 'text-charcoal-text-muted' : 'text-slate-500'}`}>Savings Rate</span>
                            <span className={`text-xs font-black ${isDark ? 'text-charcoal-text-primary' : 'text-black'}`}>
                                {totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 px-2">Main Menu</p>
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => handleNavClick(item.id)}
                                    className={`nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                                        ? 'bg-accent text-white shadow-lg shadow-accent/20 active font-bold'
                                        : 'text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <Icon size={18} className={isActive ? 'text-white' : 'text-text-muted'} />
                                    <span className="text-sm">{item.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="mt-auto p-4 mx-4 mb-4 border-t border-border/30">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Accounts</p>
                <ul className="space-y-3">
                    {accounts?.slice(0, 3)?.map((account) => {
                        const accountSpecificBalance = state.transactions
                            .filter(t => t.account_id === account.id)
                            .reduce((sum, t) => t.type === 'income' ? sum + Number(t.amount) : sum - Number(t.amount), 0);

                        return (
                            <li key={account.id} className="flex items-center justify-between group cursor-pointer">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${getAccountIconClass(account.type)}`}>
                                        <Wallet size={14} className="text-text-muted" />
                                    </div>
                                    <span className="text-[11px] font-bold text-text-primary truncate">{account.name}</span>
                                </div>
                                <span className={`text-[11px] font-black ${accountSpecificBalance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
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
