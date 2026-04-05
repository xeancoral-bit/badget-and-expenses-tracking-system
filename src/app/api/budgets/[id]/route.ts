import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { updateBudget, deleteBudget } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        await updateBudget(parseInt(params.id), body);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await deleteBudget(parseInt(params.id));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 });
    }
}
