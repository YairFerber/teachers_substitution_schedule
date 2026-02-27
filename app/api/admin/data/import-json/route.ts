import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

interface BackupData {
    exportedAt: string;
    version: string;
    data: {
        users: any[];
        teachers: any[];
        classes: any[];
        periods: any[];
        schedules: any[];
        substitutions: any[];
    };
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const text = await file.text();
        const backup: BackupData = JSON.parse(text);

        if (!backup.data || !backup.version) {
            return NextResponse.json({ error: 'Invalid backup file format' }, { status: 400 });
        }

        const { users, teachers, classes, periods, schedules, substitutions } = backup.data;

        // Delete all existing data in dependency order, then re-insert
        await prisma.$transaction(async (tx) => {
            // 1. Delete in reverse dependency order
            await tx.substitution.deleteMany();
            await tx.schedule.deleteMany();
            await tx.class.deleteMany();
            await tx.period.deleteMany();
            await tx.teacher.deleteMany();
            // Delete auth-related tables that reference User
            await tx.session.deleteMany();
            await tx.account.deleteMany();
            await tx.verificationToken.deleteMany();
            await tx.user.deleteMany();

            // 2. Re-insert in dependency order
            if (users?.length) {
                for (const u of users) {
                    await tx.user.create({
                        data: {
                            id: u.id,
                            name: u.name,
                            username: u.username,
                            email: u.email,
                            password: u.password,
                            displayPin: u.displayPin,
                            role: u.role,
                            createdAt: new Date(u.createdAt),
                            updatedAt: new Date(u.updatedAt),
                        },
                    });
                }
            }

            if (teachers?.length) {
                for (const t of teachers) {
                    await tx.teacher.create({
                        data: {
                            id: t.id,
                            firstName: t.firstName,
                            lastName: t.lastName,
                            email: t.email,
                            phone: t.phone,
                            type: t.type,
                            userId: t.userId,
                            createdAt: new Date(t.createdAt),
                            updatedAt: new Date(t.updatedAt),
                        },
                    });
                }
            }

            if (classes?.length) {
                for (const c of classes) {
                    await tx.class.create({
                        data: { id: c.id, name: c.name },
                    });
                }
            }

            if (periods?.length) {
                for (const p of periods) {
                    await tx.period.create({
                        data: { index: p.index, startTime: p.startTime, endTime: p.endTime },
                    });
                }
            }

            if (schedules?.length) {
                for (const s of schedules) {
                    await tx.schedule.create({
                        data: {
                            id: s.id,
                            teacherId: s.teacherId,
                            dayOfWeek: s.dayOfWeek,
                            hourIndex: s.hourIndex,
                            classId: s.classId,
                            subject: s.subject,
                            type: s.type,
                            createdAt: new Date(s.createdAt),
                            updatedAt: new Date(s.updatedAt),
                        },
                    });
                }
            }

            if (substitutions?.length) {
                for (const sub of substitutions) {
                    await tx.substitution.create({
                        data: {
                            id: sub.id,
                            scheduleId: sub.scheduleId,
                            substituteTeacherId: sub.substituteTeacherId,
                            date: new Date(sub.date),
                            status: sub.status,
                            absenceType: sub.absenceType,
                            absenceScope: sub.absenceScope,
                            isExtra: sub.isExtra ?? false,
                            isPaid: sub.isPaid ?? true,
                            notes: sub.notes,
                            createdAt: new Date(sub.createdAt),
                            updatedAt: new Date(sub.updatedAt),
                        },
                    });
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: `Database restored: ${users?.length || 0} users, ${teachers?.length || 0} teachers, ${classes?.length || 0} classes, ${periods?.length || 0} periods, ${schedules?.length || 0} schedules, ${substitutions?.length || 0} substitutions`,
        });
    } catch (error) {
        console.error('JSON import error:', error);
        return NextResponse.json(
            { error: 'Failed to import: ' + (error as Error).message },
            { status: 500 }
        );
    }
}
