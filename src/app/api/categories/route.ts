import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getCategories } from '@/lib/db';

export async function GET() {
    try {
        const rawCategories = await getCategories();
        // Server-side deduplication as a safety measure
        const categories = rawCategories.filter((c, index, self) => 
            index === self.findIndex((t) => (
                t.name === c.name && t.type === c.type
            ))
        );
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
