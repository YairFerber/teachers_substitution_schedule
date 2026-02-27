import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [teachers, classes, periods, schedules, substitutions, users] = await Promise.all([
            prisma.teacher.findMany(),
            prisma.class.findMany(),
            prisma.period.findMany(),
            prisma.schedule.findMany(),
            prisma.substitution.findMany(),
            prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    password: true,
                    displayPin: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ]);

        const dump = {
            exportedAt: new Date().toISOString(),
            version: '1.0',
            data: { users, teachers, classes, periods, schedules, substitutions },
        };

        const json = JSON.stringify(dump, null, 2);

        return new NextResponse(json, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="teacher_schedule_backup_${new Date().toISOString().slice(0, 10)}.json"`,
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('JSON export error:', error);
        return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
    }
}
