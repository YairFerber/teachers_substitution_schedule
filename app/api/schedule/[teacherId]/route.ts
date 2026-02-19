import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    props: { params: Promise<{ teacherId: string }> }
) {
    const params = await props.params;
    const teacherId = params.teacherId;

    try {
        const schedule = await prisma.schedule.findMany({
            where: {
                teacherId: teacherId,
            },
            include: {
                class: true,
                substitutions: true, // Also fetch subs to show status
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { hourIndex: 'asc' }
            ]
        });
        return NextResponse.json(schedule);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
}
