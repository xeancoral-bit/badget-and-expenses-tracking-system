import { NextResponse } from 'next/server';
import { getUser, updateTransaction, deleteTransaction } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = (await getUser()) as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const body = await request.json();
        const transaction = await updateTransaction(parseInt(params.id), user.id, body);
        return NextResponse.json(transaction);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = (await getUser()) as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const result = await deleteTransaction(parseInt(params.id), user.id);
        return NextResponse.json({ success: result });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
    }
}
