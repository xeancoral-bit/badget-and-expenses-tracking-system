'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Target, Trash2, Edit, X, AlertCircle, PlusCircle } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

export default function Budgets({ openModal = false }: { openModal?: boolean }) {
    const { state, dispatch, refreshData } = useApp();
    const { budgets, categories, accounts, transactions } = state;
    const [showModal, setShowModal] = useState(openModal);

    // Sync modal state with prop for navigation shortcuts
    useEffect(() => {
        if (openModal) {
            setShowModal(true);
        }
    }, [openModal]);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        category_id: 0,
        amount: '',
        period: 'monthly' as 'monthly' | 'weekly',
        start_date: new Date().toISOString().split('T')[0],
    });
    const [expenseForm, setExpenseForm] = useState({
        account_id: 0,
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
    });

    const expenseCategories = categories.filter((c) => c.type === 'expense');

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const endpoint = editingId ? `/api/budgets/${editingId}` : '/api/budgets';
        const method = editingId ? 'PUT' : 'POST';

        await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formData,
                amount: parseFloat(formData.amount),
            }),
        });

        setShowModal(false);
        setEditingId(null);
        refreshData();
        // Add notification
        dispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
                message: editingId ? 'Budget updated successfully!' : 'Budget added successfully!',
                type: 'success'
            }
        });
    };

    const handleEdit = (budget: any) => {
        setEditingId(budget.id);
        setFormData({
            category_id: budget.category_id,
            amount: budget.amount.toString(),
            period: budget.period,
            start_date: budget.start_date,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this budget?')) {
            await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
            refreshData();
        }
    };

    const openNewModal = () => {
        setEditingId(null);
        setFormData({
            category_id: expenseCategories[0]?.id || 0,
            amount: '',
            period: 'monthly',
            start_date: new Date().toISOString().split('T')[0],
        });
        setShowModal(true);
    };

    const openAddExpenseModal = (categoryId: number) => {
        setSelectedCategory(categoryId);
        setExpenseForm({
            account_id: accounts[0]?.id || 0,
            amount: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
        });
        setShowExpenseModal(true);
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();

        await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                account_id: expenseForm.account_id,
                category_id: selectedCategory,
                amount: parseFloat(expenseForm.amount),
                type: 'expense',
                description: expenseForm.description,
                date: expenseForm.date,
            }),
        });

        setShowExpenseModal(false);
        refreshData();
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary tracking-tight">Budgets</h2>
                    <p className="text-text-secondary mt-1 font-medium">Strategic spending plans</p>
                </div>
                <button onClick={openNewModal} className="btn btn-primary flex items-center gap-2 shadow-lg shadow-accent/20">
                    <Plus size={20} />
                    <span>New Plan</span>
                </button>
            </div>

            {/* Budget Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat-card border-accent/20">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-text-muted text-[10px] uppercase font-black tracking-widest">Total Planned</span>
                        <Target className="text-accent" size={20} />
                    </div>
                    <p className="text-2xl font-black text-text-primary tracking-tighter">
                        ₱{calculatedBudgets.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                    </p>
                </div>
                <div className="stat-card border-red-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-text-muted text-[10px] uppercase font-black tracking-widest">Utilized</span>
                        <AlertCircle className="text-red-500" size={20} />
                    </div>
                    <p className="text-2xl font-black text-red-600 tracking-tighter">
                        ₱{calculatedBudgets.reduce((sum, b) => sum + (b.spent || 0), 0).toLocaleString()}
                    </p>
                </div>
                <div className="stat-card border-emerald-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-text-muted text-[10px] uppercase font-black tracking-widest">Available</span>
                        <PlusCircle className="text-emerald-500" size={20} />
                    </div>
                    <p className="text-2xl font-black text-emerald-600 tracking-tighter">
                        ₱{(calculatedBudgets.reduce((sum, b) => sum + b.amount, 0) - calculatedBudgets.reduce((sum, b) => sum + (b.spent || 0), 0)).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Budget List */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {calculatedBudgets.length > 0 ? (
                    calculatedBudgets.map((budget) => {
                        const percentage = budget.amount > 0 ? ((budget.spent || 0) / budget.amount) * 100 : 0;
                        const remaining = budget.amount - (budget.spent || 0);

                        return (
                            <div key={budget.id} className="card group hover:border-accent/40 transition-all">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                                            <Target className="text-accent" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-text-primary tracking-tight">{budget.category?.name || 'Category'}</h3>
                                            <p className="text-text-muted text-[10px] uppercase font-black tracking-widest mt-1">{budget.period} Stragegy</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(budget)} className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-accent text-text-muted hover:text-white rounded-xl transition-all">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(budget.id)} className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-500 text-text-muted hover:text-white rounded-xl transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-text-muted text-[10px] font-black uppercase tracking-widest">Utilization</span>
                                        <span className={`text-xs font-black px-2 py-0.5 rounded ${percentage >= 100 ? 'bg-red-500/10 text-red-500' : percentage >= 80 ? 'bg-amber-500/10 text-amber-500' : 'bg-accent/10 text-accent'}`}>
                                            {percentage.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-accent'
                                                }`}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-border">
                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Actually Spent</p>
                                        <p className="text-lg font-black text-text-primary mt-1">₱{(budget.spent || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-border">
                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Allocated</p>
                                        <p className="text-lg font-black text-text-primary mt-1">₱{budget.amount.toLocaleString()}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => openAddExpenseModal(budget.category_id)}
                                    className="w-full btn btn-secondary group/btn py-3.5 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest"
                                >
                                    <PlusCircle size={18} className="group-hover/btn:scale-110 transition-transform" />
                                    Quick Expense
                                </button>

                                {percentage >= 80 && (
                                    <div className={`mt-5 p-4 rounded-xl flex items-center gap-3 border ${percentage >= 100 ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'
                                        }`}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${percentage >= 100 ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                                            <AlertCircle size={18} className={percentage >= 100 ? 'text-red-500' : 'text-amber-500'} />
                                        </div>
                                        <p className={`text-xs font-bold ${percentage >= 100 ? 'text-red-500' : 'text-amber-500'}`}>
                                            {percentage >= 100
                                                ? `Critical: Over budget by ₱${Math.abs(remaining).toLocaleString()}`
                                                : `Warning: Only ₱${remaining.toLocaleString()} left`
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full card py-24 text-center border-dashed">
                        <Target size={64} className="mx-auto mb-6 text-text-muted opacity-20" />
                        <p className="text-2xl font-black text-text-primary">No Financial Plans Found</p>
                        <p className="text-sm text-text-muted mt-2">Design your first budget to start automated tracking.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay z-[100]">
                    <div className="modal-content animate-fadeIn max-w-lg">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-text-primary tracking-tight">
                                    {editingId ? 'Edit Resource Plan' : 'Allocate Resources'}
                                </h3>
                                <p className="text-sm text-text-secondary font-medium mt-1">Define your spending strategies</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    dispatch({ type: 'CLOSE_MODALS' });
                                }}
                                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-text-muted"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Category</label>
                                <select
                                    value={formData.category_id || ''}
                                    onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                                    className="input py-4 font-bold"
                                    disabled={!!editingId}
                                    required
                                >
                                    <option value="">Select Strategic Area</option>
                                    {expenseCategories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Plan Amount (₱)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="input font-black text-lg py-4"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Planning Period</label>
                                <div className="flex gap-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-border">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, period: 'monthly' })}
                                        className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${formData.period === 'monthly' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-text-primary'
                                            }`}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, period: 'weekly' })}
                                        className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${formData.period === 'weekly' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-text-primary'
                                            }`}
                                    >
                                        Weekly
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Activation Date</label>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="input py-4"
                                    required
                                />
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="btn btn-primary w-full py-4 text-base font-black shadow-xl">
                                    {editingId ? 'Update Strategy' : 'Confirm Allocation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quick Expense Modal */}
            {showExpenseModal && (
                <div className="modal-overlay z-[100]">
                    <div className="modal-content animate-fadeIn max-w-lg">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-text-primary tracking-tight">Record Expense</h3>
                                <p className="text-sm text-text-secondary font-medium mt-1">Impact on {categories.find(c => c.id === selectedCategory)?.name}</p>
                            </div>
                            <button onClick={() => setShowExpenseModal(false)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-text-muted">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddExpense} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Amount (₱)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={expenseForm.amount}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                        className="input font-black text-lg py-4"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Account</label>
                                    <select
                                        value={expenseForm.account_id || ''}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, account_id: parseInt(e.target.value) })}
                                        className="input py-4 font-bold"
                                        required
                                    >
                                        <option value="">Source Account</option>
                                        {accounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Detail</label>
                                <input
                                    type="text"
                                    value={expenseForm.description}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                    className="input py-4 font-bold"
                                    placeholder="e.g. Starbucks Coffee"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Date</label>
                                <input
                                    type="date"
                                    value={expenseForm.date}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                    className="input py-4 font-bold"
                                    required
                                />
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="btn btn-primary w-full py-4 text-base font-black shadow-xl">
                                    Debit Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
