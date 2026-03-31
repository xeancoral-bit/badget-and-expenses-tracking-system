'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Trash2, Edit, X, Plus } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { format } from 'date-fns';

export default function Transactions({ openModal = false }: { openModal?: boolean }) {
    const { state, dispatch, refreshData } = useApp();
    const { transactions, categories, accounts } = state;
    const [showModal, setShowModal] = useState(openModal);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [filterType, setFilterType] = useState<string>('all');
    const [formData, setFormData] = useState({
        account_id: 0,
        amount: '',
        type: 'expense' as 'income' | 'expense',
        description: '',
        category_id: 0,
        date: new Date().toISOString().split('T')[0],
    });

    const expenseCategories = categories.filter((c) => c.type === 'expense');
    const incomeCategories = categories.filter((c) => c.type === 'income');

    // Sync modal open with prop (for sidebar 'Add Transaction' shortcut)
    useEffect(() => {
        if (openModal) {
            openAddModal();
        } else {
            setShowModal(false);
        }
    }, [openModal]);

    // Set default IDs when data loads or based on type change
    useEffect(() => {
        if (accounts.length > 0 && formData.account_id === 0) {
            setFormData(prev => ({ ...prev, account_id: accounts[0].id }));
        }
    }, [accounts, formData.account_id]);

    useEffect(() => {
        const relevantCategories = formData.type === 'expense' ? expenseCategories : incomeCategories;
        if (relevantCategories.length > 0 && formData.category_id === 0) {
            setFormData(prev => ({ ...prev, category_id: relevantCategories[0].id }));
        }
    }, [expenseCategories, incomeCategories, formData.type, formData.category_id]);

    const filteredTransactions = transactions.filter((t) => {
        const matchesType = filterType === 'all' || t.type === filterType;
        return matchesType;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const endpoint = editingId ? `/api/transactions/${editingId}` : '/api/transactions';
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
        setFormData({
            account_id: accounts[0]?.id || 0,
            amount: '',
            type: 'expense',
            description: '',
            category_id: expenseCategories[0]?.id || 0,
            date: new Date().toISOString().split('T')[0],
        });
        // If we came from the sidebar shortcut, go back to transactions tab
        if (openModal) {
            dispatch({ type: 'SET_ACTIVE_TAB', payload: 'transactions' });
        }
        refreshData();
        // Add notification
        dispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
                message: editingId ? 'Transaction updated successfully!' : 'Transaction added successfully!',
                type: 'success'
            }
        });
    };

    const handleEdit = (transaction: any) => {
        setEditingId(transaction.id);
        setFormData({
            account_id: transaction.account_id,
            amount: transaction.amount.toString(),
            type: transaction.type,
            description: transaction.description,
            category_id: transaction.category_id,
            date: transaction.date.split('T')[0],
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this transaction?')) {
            await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
            refreshData();
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setFormData({
            account_id: accounts[0]?.id || 0,
            amount: '',
            type: 'expense',
            description: '',
            category_id: expenseCategories[0]?.id || 0,
            date: new Date().toISOString().split('T')[0],
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        dispatch({ type: 'CLOSE_MODALS' });
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary tracking-tight">Transactions</h2>
                    <p className="text-text-secondary mt-1 font-medium">History of your financial activities</p>
                </div>
                <button onClick={openAddModal} className="btn btn-primary flex items-center gap-2 shadow-lg shadow-accent/20">
                    <Plus size={20} />
                    <span>New Transaction</span>
                </button>
            </div>

            {/* Filters */}
            <div className="card bg-slate-50 dark:bg-slate-800/50 border-border">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-border">
                        {['all', 'income', 'expense'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all uppercase tracking-wider ${filterType === type 
                                    ? 'bg-accent text-white shadow-lg' 
                                    : 'text-text-muted hover:text-text-primary'}`}
                            >
                                {type === 'all' ? 'All Activity' : type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                        <div key={transaction.id} className="card group hover:border-accent/50 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${transaction.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                            }`}
                                    >
                                        {transaction.type === 'income' ? (
                                            <ArrowUpRight className="text-emerald-500" size={28} />
                                        ) : (
                                            <ArrowDownRight className="text-red-500" size={28} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-text-primary font-bold text-lg leading-tight">{transaction.description}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[10px] font-black text-accent uppercase bg-accent/10 px-2 py-0.5 rounded tracking-widest leading-none">
                                                {transaction.category?.name || 'Uncategorized'}
                                            </span>
                                            <span className="text-xs text-text-muted font-bold">•</span>
                                            <span className="text-xs text-text-muted font-medium">
                                                {transaction.account?.name || 'Main Account'} • {format(new Date(transaction.date), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <span className={`text-2xl font-black tracking-tighter ${transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {transaction.type === 'income' ? '+' : '-'}₱{transaction.amount.toLocaleString()}
                                    </span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(transaction)} className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-accent text-text-muted hover:text-white rounded-xl transition-all">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(transaction.id)} className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-500 text-text-muted hover:text-white rounded-xl transition-all">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card text-center py-20 border-dashed">
                        <ArrowUpRight size={56} className="mx-auto mb-4 text-text-muted opacity-20" />
                        <p className="text-text-primary font-black text-xl">No activities matching filter</p>
                        <p className="text-sm text-text-muted mt-2">Try adjusting your filters or add a new transaction.</p>
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
                                    {editingId ? 'Edit Record' : 'Log Activity'}
                                </h3>
                                <p className="text-sm text-text-secondary font-medium mt-1">Fill in the details below</p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-text-muted"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex items-center gap-3 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-border">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'expense', category_id: expenseCategories[0]?.id || 0 })}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${formData.type === 'expense' 
                                        ? 'bg-red-500 text-white shadow-lg' 
                                        : 'text-text-muted hover:text-text-primary'
                                    }`}
                                >
                                    <ArrowDownRight size={16} />
                                    Expense
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'income', category_id: incomeCategories[0]?.id || 0 })}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${formData.type === 'income' 
                                        ? 'bg-emerald-500 text-white shadow-lg' 
                                        : 'text-text-muted hover:text-text-primary'
                                    }`}
                                >
                                    <ArrowUpRight size={16} />
                                    Income
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Amount (₱)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="input font-bold text-lg py-4"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="input py-4"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input py-4"
                                    placeholder="e.g. Weekly Grocery Shopping"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Account</label>
                                    <select
                                        value={formData.account_id}
                                        onChange={(e) => setFormData({ ...formData, account_id: parseInt(e.target.value) })}
                                        className="input py-4"
                                    >
                                        {accounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Category</label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                                        className="input py-4"
                                    >
                                        {(formData.type === 'expense' ? expenseCategories : incomeCategories).map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="btn btn-primary w-full py-4 text-base font-black shadow-xl">
                                    {editingId ? 'Save Changes' : 'Confirm Transaction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
