import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getUser, getBudgets, createBudget } from '@/lib/db';

export async function GET() {
    try {
        const user = (await getUser()) as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const budgets = await getBudgets(user.id);
        return NextResponse.json(budgets);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = (await getUser()) as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const body = await request.json();
        const budget = await createBudget(user.id, body);
        return NextResponse.json(budget);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 });
    }
}
