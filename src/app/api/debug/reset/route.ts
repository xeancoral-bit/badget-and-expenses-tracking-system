import { NextResponse } from 'next/server';
import { getUser, resetUserData } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const user = (await getUser()) as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        await resetUserData(user.id);
        
        return NextResponse.json({ success: true, message: 'All data has been reset' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to reset data', details: error.message }, { status: 500 });
    }
}
