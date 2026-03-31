'use client';

import React from 'react';
import { useApp } from '@/lib/AppContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import Transactions from '@/components/Transactions';
import Budgets from '@/components/Budgets';
import Analytics from '@/components/Analytics';
import Chat from '@/components/Chat';
import { Loader2 } from 'lucide-react';

export default function Home() {
    const { state } = useApp();
    const { activeTab, isLoading } = state;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-primary">
                <div className="text-center">
                    <Loader2 className="animate-spin text-accent mx-auto mb-4" size={48} />
                    <p className="text-text-secondary">Loading SmartBudget AI...</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard />;
            case 'transactions':
                return <Transactions openModal={state.showAddTransactionModal} />;
            case 'budgets':
                return <Budgets openModal={state.showAddBudgetModal} />;
            case 'analytics':
                return <Analytics />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="min-h-screen bg-primary">
            <Sidebar />
            <Header />
            <main className="ml-[280px] mt-16 p-8">
                {renderContent()}
            </main>
            <Chat />
        </div>
    );
}
