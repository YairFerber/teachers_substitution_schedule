import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get('teacherId');
    const month = searchParams.get('month'); // YYYY-MM

    if (!teacherId || !month) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const [year, monthStr] = month.split('-');
    const startDate = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(monthStr), 0, 23, 59, 59);

    const substitutions = await prisma.substitution.findMany({
        where: {
            substituteTeacherId: teacherId,
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            schedule: {
                include: { class: true }
            }
        },
        orderBy: { date: 'asc' }
    });

    return NextResponse.json(substitutions);
}
