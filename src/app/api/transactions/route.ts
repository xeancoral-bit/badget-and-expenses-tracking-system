import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getUser, getTransactions, createTransaction } from '@/lib/db';

export async function GET() {
    try {
        const user = (await getUser()) as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const transactions = await getTransactions(user.id);
        return NextResponse.json(transactions);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = (await getUser()) as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const body = await request.json();
        console.log('API POST /transactions - creating:', body);
        const transaction = await createTransaction(user.id, body);
        return NextResponse.json(transaction);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}
