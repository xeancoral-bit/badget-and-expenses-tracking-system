import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getUser, getFinancialSummary } from '@/lib/db';

export async function GET() {
    try {
        const user = (await getUser()) as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const summary = await getFinancialSummary(user.id);
        return NextResponse.json(summary);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
    }
}
