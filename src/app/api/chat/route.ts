import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getUser, getChatHistory } from '@/lib/db';
import { processChatMessage } from '@/lib/ai-service';

export async function POST(request: Request) {
    try {
        const user = (await getUser()) as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const body = await request.json();
        const result = await processChatMessage(user.id, body.message);

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const user = (await getUser()) as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const history = await getChatHistory(user.id);
        return NextResponse.json(history);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
