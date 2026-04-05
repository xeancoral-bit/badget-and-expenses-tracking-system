import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getUser } from '@/lib/db';
import { generateInsights } from '@/lib/ai-service';

export async function GET() {
    try {
        const user = (await getUser()) as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const insights = await generateInsights(user.id);
        return NextResponse.json(insights);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
    }
}
