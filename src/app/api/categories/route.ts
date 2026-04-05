import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getCategories } from '@/lib/db';

export async function GET() {
    try {
        const categories = await getCategories();
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
