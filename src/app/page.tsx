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
    const { activeTab, isLoading, sidebarOpen } = state;
    const { dispatch } = useApp();

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
        <div className="min-h-screen bg-primary transition-colors duration-300">
            {/* Sidebar Overlay for mobile */}
            <div 
                className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
                onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            />

            <Sidebar />
            <Header />
            
            <main className={`transition-all duration-300 pt-16 min-h-screen ${sidebarOpen ? 'lg:pl-[280px]' : 'pl-0'}`}>
                <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
                    {renderContent()}
                </div>
            </main>
            <Chat />
        </div>
    );
}
