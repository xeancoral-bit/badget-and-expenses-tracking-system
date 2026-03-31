import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db';

export async function GET() {
    try {
        const user = await getUser();
        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}
