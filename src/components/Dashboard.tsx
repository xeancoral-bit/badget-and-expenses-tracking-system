'use client';

import React from 'react';
import { TrendingUp, DollarSign, Wallet, CreditCard, Target, AlertCircle, ArrowUpRight, ArrowDownRight, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { format } from 'date-fns';

export default function Dashboard() {
    const { state } = useApp();
    const { summary, transactions, budgets, insights, spending, accounts } = state;

    // Calculate dynamic spent amounts based on current month transactions
    const calculatedBudgets = React.useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const dateStr = startOfMonth.toISOString().split('T')[0];

        return budgets.map(budget => {
            const localSpent = transactions
                .filter(t => t.type === 'expense' && t.date >= dateStr && t.category_id === budget.category_id)
                .reduce((sum, t) => sum + Number(t.amount), 0);
            
            return {
                ...budget,
                spent: localSpent > 0 ? localSpent : (budget.spent || 0)
            };
        });
    }, [budgets, transactions]);

    const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

    const derivedSpending = React.useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const dateStr = startOfMonth.toISOString().split('T')[0];

        const expenseTransactions = transactions.filter(
            t => t.type === 'expense' && t.date >= dateStr
        );

        const categoryTotals: Record<string, { amount: number; color: string }> = {};
        let totalExpenses = 0;

        expenseTransactions.forEach(t => {
            const categoryName = t.category?.name || (t as any).category_name || 'Other';
            const color = t.category?.color || (t as any).category_color || '#cbd5e1';
            const amount = Number(t.amount);

            if (!categoryTotals[categoryName]) {
                categoryTotals[categoryName] = { amount: 0, color };
            }
            categoryTotals[categoryName].amount += amount;
            totalExpenses += amount;
        });

        return Object.entries(categoryTotals).map(([category, data], index) => ({
            category,
            amount: data.amount,
            color: data.color || COLORS[index % COLORS.length],
            percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0
        })).sort((a, b) => b.amount - a.amount);
    }, [transactions]);

    const stats = React.useMemo(() => {
        const clientAllTimeIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const clientAllTimeExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const serverAllTimeIncome = summary?.allTimeIncome || 0;
        const serverAllTimeExpenses = summary?.allTimeExpenses || 0;

        const allTimeIncome = Math.max(serverAllTimeIncome, clientAllTimeIncome);
        const allTimeExpenses = Math.max(serverAllTimeExpenses, clientAllTimeExpenses);

        const balance = allTimeIncome - allTimeExpenses;
        const savingsRate = allTimeIncome > 0 
            ? ((allTimeIncome - allTimeExpenses) / allTimeIncome) * 100 
            : 0;

        return {
            balance,
            allTimeIncome,
            allTimeExpenses,
            savingsRate,
        };
    }, [summary, transactions]);

    // Savings rate interpretation
    const savingsRateInfo = React.useMemo(() => {
        const rate = stats.savingsRate;
        if (rate >= 30) return { label: 'Excellent', color: 'text-emerald-500', bg: 'bg-emerald-500', icon: ShieldCheck };
        if (rate >= 20) return { label: 'Healthy', color: 'text-emerald-500', bg: 'bg-emerald-500', icon: ShieldCheck };
        if (rate >= 10) return { label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500', icon: ShieldAlert };
        if (rate >= 0)  return { label: 'Low', color: 'text-red-500', bg: 'bg-red-500', icon: ShieldX };
        return { label: 'Deficit', color: 'text-red-600', bg: 'bg-red-600', icon: ShieldX };
    }, [stats.savingsRate]);

    const recentTransactions = transactions.slice(0, 5);

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-text-primary tracking-tight">Financial Overview</h2>
                    <p className="text-text-muted text-sm font-medium">Tracking your wealth in real-time.</p>
                </div>
                <div className="hidden md:flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">All Time Net</span>
                        <span className={`text-sm font-black ${(stats.allTimeIncome - stats.allTimeExpenses) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {(stats.allTimeIncome - stats.allTimeExpenses) >= 0 ? '+' : ''}₱{(stats.allTimeIncome - stats.allTimeExpenses).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Balance */}
                <div className="stat-card border-accent/20">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-text-muted text-xs uppercase tracking-widest font-bold">Total Balance</span>
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                            <Wallet className="text-accent" size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-text-primary tracking-tighter">₱{stats.balance.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-emerald-600 font-bold px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 rounded">SAFE</span>
                        <span className="text-xs text-text-muted">Available now</span>
                    </div>
                </div>

                {/* Income — All-Time Total */}
                <div className="stat-card border-emerald-500/20 group">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-text-muted text-xs uppercase tracking-widest font-bold">Income</span>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ArrowUpRight className="text-emerald-500" size={20} />
                        </div>
                    </div>
                    <p 
                        id="d_alltimeincome"
                        key={`inc-${stats.allTimeIncome}`}
                        className="text-2xl font-bold text-emerald-600 tracking-tighter animate-fadeIn"
                    >
                        ₱{stats.allTimeIncome.toLocaleString()}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-text-muted mt-2 tracking-wider">
                        Overall Earnings
                    </p>
                </div>

                {/* Expenses — All-Time Total */}
                <div className="stat-card border-red-500/20 group">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-text-muted text-xs uppercase tracking-widest font-bold">Expenses</span>
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ArrowDownRight className="text-red-500" size={20} />
                        </div>
                    </div>
                    <p 
                        id="d_alltimeexpenses"
                        key={`exp-${stats.allTimeExpenses}`}
                        className="text-2xl font-bold text-red-600 tracking-tighter animate-fadeIn"
                    >
                        ₱{stats.allTimeExpenses.toLocaleString()}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-text-muted mt-2 tracking-wider">
                        Overall Spending
                    </p>
                </div>

                {/* Savings Rate — Meaningful visualization */}
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-text-muted text-xs uppercase tracking-widest font-bold">Savings Rate</span>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            stats.savingsRate >= 20 ? 'bg-emerald-500/10' : stats.savingsRate >= 10 ? 'bg-amber-500/10' : 'bg-red-500/10'
                        }`}>
                            {React.createElement(savingsRateInfo.icon, { 
                                className: savingsRateInfo.color, 
                                size: 20 
                            })}
                        </div>
                    </div>
                    <p className={`text-2xl font-bold tracking-tighter ${savingsRateInfo.color}`}>
                        {stats.savingsRate.toFixed(1)}%
                    </p>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${savingsRateInfo.bg}`}
                            style={{ width: `${Math.max(0, Math.min(stats.savingsRate, 100))}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${savingsRateInfo.color}`}>
                            {savingsRateInfo.label}
                        </span>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            ₱{(stats.allTimeIncome - stats.allTimeExpenses).toLocaleString()} saved
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Insights & Recent */}
                <div className="lg:col-span-2 space-y-6">
                    {/* AI Insights */}
                    {insights.length > 0 && (
                        <div className="card overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <AlertCircle size={80} />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
                                <AlertCircle size={20} className="text-amber-500" />
                                AI Strategic Insights
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {insights.slice(0, 4).map((insight) => (
                                    <div
                                        key={insight.id}
                                        className={`p-4 rounded-xl border-l-4 transition-all hover:translate-x-1 ${insight.type === 'warning'
                                            ? 'bg-amber-500/10 border-amber-500'
                                            : insight.type === 'suggestion'
                                                ? 'bg-accent/10 border-accent'
                                                : 'bg-emerald-500/10 border-emerald-500'
                                            }`}
                                    >
                                        <p className="font-bold text-text-primary text-sm">{insight.title}</p>
                                        <p className="text-xs text-text-muted mt-2 leading-relaxed">{insight.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Transactions */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                <CreditCard size={20} className="text-accent" />
                                Recent Activity
                            </h3>
                            <button className="text-xs font-bold text-accent hover:underline uppercase tracking-wider">View All</button>
                        </div>
                        {recentTransactions.length > 0 ? (
                            <div className="space-y-4">
                                {recentTransactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`w-11 h-11 rounded-xl flex items-center justify-center ${transaction.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                                    }`}
                                            >
                                                {transaction.type === 'income' ? (
                                                    <ArrowUpRight className="text-emerald-500" size={20} />
                                                ) : (
                                                    <ArrowDownRight className="text-red-500" size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-text-primary font-bold">{transaction.description}</p>
                                                <p className="text-xs text-text-muted font-medium mt-1">
                                                    {transaction.category?.name || (transaction as any).category_name || 'Uncategorized'} • {format(new Date(transaction.date), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-lg font-black ${transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {transaction.type === 'income' ? '+' : '-'}₱{Number(transaction.amount).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-text-muted">
                                <CreditCard size={48} className="mx-auto mb-4 opacity-10" />
                                <p className="font-bold">No activity recorded</p>
                                <p className="text-xs mt-1">Start by adding your first transaction</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Budgets & Spending */}
                <div className="space-y-6">
                    {/* Budget Overview */}
                    {calculatedBudgets.length > 0 && (
                        <div className="card">
                            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
                                <Target size={20} className="text-accent" />
                                Budget Tracking
                            </h3>
                            <div className="space-y-6">
                                {calculatedBudgets.slice(0, 5).map((budget) => {
                                    const percentage = budget.amount > 0 ? ((budget.spent || 0) / budget.amount) * 100 : 0;
                                    return (
                                        <div key={budget.id} className="group">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-text-primary text-sm font-bold">{budget.category?.name || 'Category'}</span>
                                                <span className="text-[11px] text-text-muted font-bold group-hover:text-accent transition-colors">
                                                    {percentage.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-700 ${percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                                        }`}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-2">
                                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                                                    ₱{(budget.spent || 0).toLocaleString()} spent
                                                </span>
                                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                                                    ₱{budget.amount.toLocaleString()} limit
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Spending by Category Small Info */}
                    {derivedSpending.length > 0 && (
                        <div className="card">
                            <h3 className="text-lg font-bold text-text-primary mb-6">Spending Distribution</h3>
                            <div className="space-y-4">
                                {derivedSpending.slice(0, 5).map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: `${item.color}20` }}
                                        >
                                            <span style={{ color: item.color }} className="font-bold text-xs">
                                                {item.percentage.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-text-primary text-sm font-bold truncate">{item.category}</p>
                                            <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">₱{item.amount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
