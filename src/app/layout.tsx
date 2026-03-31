import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/AppContext';

export const metadata: Metadata = {
    title: 'SmartBudget AI - AI-Powered Budget & Expense Tracking',
    description: 'Track your finances with AI-powered insights, natural language commands, and real-time budget management.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <AppProvider>
                    {children}
                </AppProvider>
            </body>
        </html>
    );
}
