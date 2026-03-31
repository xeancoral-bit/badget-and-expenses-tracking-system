import { NextResponse } from 'next/server';
import { getUser, getSpendingByCategory } from '@/lib/db';

export async function GET() {
    try {
        const user = (await getUser()) as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const spending = await getSpendingByCategory(user.id);
        return NextResponse.json(spending);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch spending' }, { status: 500 });
    }
}
