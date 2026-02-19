import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const teachers = await prisma.teacher.findMany({
            orderBy: {
                lastName: 'asc',
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
            }
        });
        return NextResponse.json(teachers);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
    }
}
