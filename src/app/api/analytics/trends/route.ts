import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getUser, getMonthlyTrends } from '@/lib/db';

export async function GET() {
    try {
        const user = (await getUser()) as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const trends = await getMonthlyTrends(user.id, 6);
        return NextResponse.json(trends);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
    }
}
