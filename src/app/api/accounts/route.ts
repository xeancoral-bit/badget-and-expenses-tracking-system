import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getUser, getAccounts, createAccount } from '@/lib/db';

export async function GET() {
    try {
        const user = (await getUser()) as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const accounts = await getAccounts(user.id);
        return NextResponse.json(accounts);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = (await getUser()) as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const body = await request.json();
        const account = await createAccount(user.id, body);
        return NextResponse.json(account);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}
