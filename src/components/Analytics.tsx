'use client';

import React from 'react';
import { PieChart, BarChart, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import {
    PieChart as RechartsPie,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart as RechartsBar,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';

export default function Analytics() {
    const { state, dispatch } = useApp();
    const { spending, trends, summary, budgets, transactions } = state;

    const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

    // Derive spending data from transactions if API returns empty
    // Derive spending data strictly from live transactions for instant UI syncing
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
    }, [spending, transactions]);

    // Derive trends data from transactions if API returns empty
    // Derive trends data strictly from live transactions
    const derivedTrends = React.useMemo(() => {

        const monthData: Record<string, { month: string; income: number; expenses: number }> = {};

        // Initialize last 6 months
        for (let i = 0; i < 6; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toISOString().substring(0, 7);
            const monthName = date.toLocaleString('default', { month: 'short' });
            monthData[monthKey] = { month: monthName, income: 0, expenses: 0 };
        }

        transactions.forEach(t => {
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
    }, [trends, transactions]);

    // Derive summary from transactions if API returns empty
    // Derive summary from live transactions
    const derivedSummary = React.useMemo(() => {

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const dateStr = startOfMonth.toISOString().split('T')[0];

        const monthTransactions = transactions.filter(t => t.date >= dateStr);

        let totalIncome = 0;
        let totalExpenses = 0;

        monthTransactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += Number(t.amount);
            } else {
                totalExpenses += Number(t.amount);
            }
        });

        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

        return {
            totalBalance: 0,
            totalIncome,
            totalExpenses,
            savingsRate,
            transactionsThisMonth: monthTransactions.length
        };
    }, [summary, transactions]);

    // Calculate budget analytics
    const budgetAnalytics = budgets.map(budget => {
        // Compute dynamically to ensure "connection"
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const dateStr = startOfMonth.toISOString().split('T')[0];
        
        const localSpent = transactions
            .filter(t => t.type === 'expense' && t.date >= dateStr && t.category_id === budget.category_id)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const actualSpent = localSpent > 0 ? localSpent : (budget.spent || 0);

        const percentage = budget.amount > 0 ? (actualSpent / budget.amount) * 100 : 0;
        const remaining = budget.amount - actualSpent;
        const isOverBudget = percentage >= 100;
        const isNearBudget = percentage >= 80 && percentage < 100;
        return {
            ...budget,
            spent: actualSpent,
            percentage,
            remaining,
            isOverBudget,
            isNearBudget
        };
    }).sort((a, b) => b.percentage - a.percentage);

    const overBudgetCount = budgetAnalytics.filter(b => b.isOverBudget).length;
    const nearBudgetCount = budgetAnalytics.filter(b => b.isNearBudget).length;
    const totalBudgetAmount = budgetAnalytics.reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const totalSpentAmount = budgetAnalytics.reduce((sum, b) => sum + Number(b.spent || 0), 0);

    // Use derived data if API data is empty
    const displaySpending = derivedSpending;
    const displayTrends = derivedTrends;
    const displaySummary = derivedSummary;

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary tracking-tight">Analytics</h2>
                    <p className="text-text-secondary mt-1 font-medium">Deep insights into your financial behavior</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="stat-card border-emerald-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-text-muted text-[10px] uppercase font-black tracking-widest">Inflow</span>
                        <TrendingUp className="text-emerald-500" size={18} />
                    </div>
                    <p className="text-2xl font-black text-text-primary tracking-tighter">₱{displaySummary?.totalIncome?.toLocaleString() || '0'}</p>
                </div>
                <div className="stat-card border-red-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-text-muted text-[10px] uppercase font-black tracking-widest">Outflow</span>
                        <TrendingDown className="text-red-500" size={18} />
                    </div>
                    <p className="text-2xl font-black text-text-primary tracking-tighter">₱{displaySummary?.totalExpenses?.toLocaleString() || '0'}</p>
                </div>
                <div className="stat-card border-accent/20">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-text-muted text-[10px] uppercase font-black tracking-widest">Volume</span>
                        <PieChart className="text-accent" size={18} />
                    </div>
                    <p className="text-2xl font-black text-text-primary tracking-tighter">{displaySummary?.transactionsThisMonth || 0}</p>
                </div>
                <div className="stat-card border-accent/20 bg-accent/5">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-text-muted text-[10px] uppercase font-black tracking-widest">Efficiency</span>
                        <BarChart className="text-accent" size={18} />
                    </div>
                    <p className="text-2xl font-black text-accent tracking-tighter">{(displaySummary?.savingsRate ?? 0).toFixed(1)}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-text-primary tracking-tight">Allocation Spectrum</h3>
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-text-muted">
                            <PieChart size={16} />
                        </div>
                    </div>
                    {displaySpending.length > 0 ? (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPie>
                                    <Pie
                                        data={displaySpending}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="amount"
                                        nameKey="category"
                                        stroke="none"
                                    >
                                        {displaySpending.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '16px',
                                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
                                        }}
                                        labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                        itemStyle={{ color: '#1e293b' }}
                                        formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Amount']}
                                    />
                                </RechartsPie>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-text-muted font-bold">
                            Awaiting transaction data...
                        </div>
                    )}
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-text-primary tracking-tight">Flow Volatility</h3>
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-text-muted">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    {displayTrends.length > 0 ? (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBar data={displayTrends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.3} />
                                    <XAxis 
                                        dataKey="month" 
                                        stroke="#64748b" 
                                        fontSize={11}
                                        fontWeight="bold"
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis 
                                        stroke="#64748b" 
                                        fontSize={11}
                                        fontWeight="bold"
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `₱${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '16px',
                                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
                                        }}
                                        itemStyle={{ color: '#1e293b' }}
                                        formatter={(value: number) => [`₱${value.toLocaleString()}`, '']}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="income" name="Inflow" fill="#10B981" radius={[6, 6, 0, 0]} barSize={20} />
                                    <Bar dataKey="expenses" name="Outflow" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={20} />
                                </RechartsBar>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-text-muted font-bold">
                            Insufficient historical records...
                        </div>
                    )}
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="flex items-center justify-between mb-8 px-2">
                    <h3 className="text-xl font-black text-text-primary tracking-tight">Granular Intensity</h3>
                    <div className="text-[10px] font-black uppercase text-accent tracking-tighter bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">
                        Monthly Resolution
                    </div>
                </div>
                {displaySpending.length > 0 ? (
                    <div className="table-container">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left py-4 px-6">Domain</th>
                                    <th className="text-right py-4 px-6">Magnitude</th>
                                    <th className="text-right py-4 px-6">Composition</th>
                                    <th className="text-right py-4 px-6">Benchmark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displaySpending.map((item, index) => (
                                    <tr key={index} className="group">
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                                                    style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
                                                />
                                                <span className="text-text-primary font-bold">{item.category}</span>
                                            </div>
                                        </td>
                                        <td className="text-right py-5 px-6 text-text-primary font-black tracking-tight">
                                            ₱{item.amount.toLocaleString()}
                                        </td>
                                        <td className="text-right py-5 px-6 text-text-muted font-bold">
                                            {item.percentage.toFixed(1)}%
                                        </td>
                                        <td className="text-right py-5 px-6">
                                            <div className="w-28 ml-auto bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000"
                                                    style={{
                                                        width: `${item.percentage}%`,
                                                        backgroundColor: item.color || COLORS[index % COLORS.length]
                                                    }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-16 text-text-muted font-black border-2 border-dashed border-border rounded-2xl">
                        Awaiting data input for breakdown...
                    </div>
                )}
            </div>

            {/* Budget Analytics Section */}
            {budgets.length > 0 && (
                <div className="card">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <h3 className="text-xl font-black text-text-primary tracking-tight flex items-center gap-3">
                            <Target size={24} className="text-accent" />
                            Strategy Compliance
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <button 
                            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'budgets' })}
                            className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border text-left hover:border-accent/40 hover:shadow-md transition-all group"
                        >
                            <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1.5 group-hover:text-accent transition-colors">Total Allocation</p>
                            <p className="text-xl font-black text-text-primary">₱{totalBudgetAmount.toLocaleString()}</p>
                        </button>
                        <button 
                            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'budgets' })}
                            className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border text-left hover:border-red-500/40 hover:shadow-md transition-all group"
                        >
                            <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1.5 group-hover:text-red-500 transition-colors">Total Consumption</p>
                            <p className="text-xl font-black text-red-500">₱{totalSpentAmount.toLocaleString()}</p>
                        </button>
                        <button 
                            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'budgets' })}
                            className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border text-left hover:border-red-500/40 hover:shadow-md transition-all group"
                        >
                            <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1.5 group-hover:text-red-500 transition-colors">Breach Events</p>
                            <p className="text-xl font-black text-red-500">{overBudgetCount}</p>
                        </button>
                        <button 
                            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'budgets' })}
                            className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border text-left hover:border-amber-500/40 hover:shadow-md transition-all group"
                        >
                            <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1.5 group-hover:text-amber-500 transition-colors">Risk Exposure</p>
                            <p className="text-xl font-black text-amber-500">{nearBudgetCount}</p>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {budgetAnalytics.slice(0, 4).map((budget) => (
                            <div key={budget.id} className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border group hover:border-accent/50 transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="font-black text-text-primary">
                                            {budget.category?.name || 'Category'}
                                        </span>
                                        {budget.isOverBudget && (
                                            <span className="px-2.5 py-1 text-[9px] font-black uppercase bg-red-500/10 text-red-500 rounded-lg tracking-widest leading-none border border-red-500/20">
                                                Breach
                                            </span>
                                        )}
                                        {budget.isNearBudget && !budget.isOverBudget && (
                                            <span className="px-2.5 py-1 text-[9px] font-black uppercase bg-amber-500/10 text-amber-500 rounded-lg tracking-widest leading-none border border-amber-500/20">
                                                Risk
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                        {budget.period} cycle
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner mb-4">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${budget.isOverBudget
                                            ? 'bg-red-500'
                                            : budget.isNearBudget
                                                ? 'bg-amber-500'
                                                : 'bg-accent'
                                            }`}
                                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold">
                                    <span className={budget.isOverBudget ? 'text-red-500' : 'text-text-muted'}>
                                        {budget.isOverBudget
                                            ? `Deficit: ₱${Math.abs(budget.remaining).toLocaleString()}`
                                            : `Surplus: ₱${budget.remaining.toLocaleString()}`
                                        }
                                    </span>
                                    <span className="text-text-primary px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                        {budget.percentage.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
