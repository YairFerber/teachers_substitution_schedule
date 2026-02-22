'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function markAbsence(scheduleId: string, date: Date, absenceType: string = 'SICK') {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    // Normalize date to UTC Midnight to prevent timezone shifting
    const d = new Date(date);
    const startOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

    const existing = await prisma.substitution.findFirst({
        where: {
            scheduleId,
            date: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    });

    if (existing) {
        await prisma.substitution.update({
            where: { id: existing.id },
            data: {
                status: 'ABSENT',
                substituteTeacherId: null,
                absenceType,
                isExtra: false
            }
        });
    } else {
        await prisma.substitution.create({
            data: {
                scheduleId,
                date: startOfDay, // Save as standardized start of day
                status: 'ABSENT',
                absenceType,
                isExtra: false
            }
        });
    }

    revalidatePath('/', 'layout');
    return { success: true };
}

export async function cancelAbsence(substitutionId: string) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    await prisma.substitution.delete({
        where: { id: substitutionId }
    });

    revalidatePath('/', 'layout'); // Force global layout refresh to catch all nested routes including daily and teachers
    return { success: true };
}

export async function findAvailableTeachers(date: Date, hourIndex: number) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const dayOfWeek = date.getDay(); // 0-6

    // Normalize date to UTC Midnight for consistency
    const d = new Date(date);
    const startOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

    // Get all teachers
    const allTeachers = await prisma.teacher.findMany({
        orderBy: { lastName: 'asc' }
    });

    // 1. Get teachers busy with their REGULAR schedule
    const busySchedules = await prisma.schedule.findMany({
        where: {
            dayOfWeek,
            hourIndex,
            type: { in: ['REGULAR', 'MEETING'] }
        },
        select: { teacherId: true }
    });

    const busyTeacherIds = new Set(busySchedules.map((s: any) => s.teacherId));

    // 2. Get teachers busy because they are SUBSTITUTING for someone else at this time
    const busySubstitutes = await prisma.substitution.findMany({
        where: {
            date: {
                gte: startOfDay,
                lte: endOfDay
            },
            schedule: {
                hourIndex: hourIndex
            },
            substituteTeacherId: { not: null }
        },
        select: { substituteTeacherId: true }
    });

    busySubstitutes.forEach((s: any) => {
        if (s.substituteTeacherId) busyTeacherIds.add(s.substituteTeacherId);
    });

    // 3. Get all schedules for this hour to identify Stay/Individual tags
    const hourSchedules = await prisma.schedule.findMany({
        where: { dayOfWeek, hourIndex },
        select: { teacherId: true, type: true }
    });

    const teacherSchedules = new Map(hourSchedules.map(s => [s.teacherId, s.type]));

    // Filter out busy teachers and enrich with status
    const processed = allTeachers.map((t: any) => {
        let status = 'FREE';
        let label = 'פנוי';

        const isBusySubbing = Array.from(busySubstitutes).some((s: any) => s.substituteTeacherId === t.id);

        if (isBusySubbing) {
            status = 'BUSY_SUB';
            label = 'ממלא מקום';
        } else if (busyTeacherIds.has(t.id)) {
            status = 'BUSY_CLASS';
            label = 'בשיעור';
        } else {
            const schedType = teacherSchedules.get(t.id);
            if (schedType === 'STAY') {
                status = 'STAY';
                label = 'שהייה';
            } else if (schedType === 'INDIVIDUAL') {
                status = 'INDIVIDUAL';
                label = 'פרטני';
            }
        }

        return {
            ...t,
            status,
            label
        };
    });

    const candidates = processed.filter(p => ['FREE', 'STAY', 'INDIVIDUAL', 'BUSY_CLASS'].includes(p.status));

    candidates.sort((a, b) => {
        const score = (p: any) => {
            if (p.status === 'STAY') return 1;
            if (p.status === 'INDIVIDUAL') return 2;
            if (p.status === 'FREE' && p.type === 'SUBSTITUTE') return 3;
            if (p.status === 'FREE') return 4;
            if (p.status === 'BUSY_CLASS') return 5;
            return 9;
        };
        return score(a) - score(b);
    });

    return candidates;
}

export async function assignSubstitute(substitutionId: string, substituteTeacherId: string, isExtra: boolean = false) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    await prisma.substitution.update({
        where: { id: substitutionId },
        data: {
            substituteTeacherId,
            status: 'COVERED',
            isExtra
        }
    });

    revalidatePath('/', 'layout');
    return { success: true };
}

export async function toggleExtraClass(teacherId: string, date: Date, hourIndex: number, isExtra: boolean, notes: string = '') {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const dayOfWeek = date.getDay();
    const d = new Date(date);
    const startOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));

    // Find or create schedule
    let schedule = await prisma.schedule.findUnique({
        where: { teacherId_dayOfWeek_hourIndex: { teacherId, dayOfWeek, hourIndex } }
    });

    if (!schedule) {
        schedule = await prisma.schedule.create({
            data: { teacherId, dayOfWeek, hourIndex, type: 'FREE', subject: 'Ad-hoc' }
        });
    }

    const existing = await prisma.substitution.findFirst({
        where: { scheduleId: schedule.id, date: startOfDay }
    });

    if (existing) {
        await prisma.substitution.update({
            where: { id: existing.id },
            data: { isExtra, notes, substituteTeacherId: teacherId, status: isExtra ? 'COVERED' : existing.status }
        });
        // If we turned OFF extra and it was just a dummy for tracking:
        if (!isExtra && existing.status === 'COVERED' && existing.substituteTeacherId === teacherId) {
            await prisma.substitution.delete({ where: { id: existing.id } });
        }
    } else if (isExtra) {
        await prisma.substitution.create({
            data: {
                scheduleId: schedule.id,
                date: startOfDay,
                status: 'COVERED',
                isExtra: true,
                notes,
                substituteTeacherId: teacherId
            }
        });
    }

    revalidatePath('/', 'layout');
    return { success: true };
}

export async function getTeacherAbsences(teacherId: string, startDate: Date, endDate: Date) {
    const session = await auth();
    // if (!session?.user) { ... }

    const absences = await prisma.substitution.findMany({
        where: {
            schedule: { teacherId },
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            substituteTeacher: true,
            schedule: true
        }
    });

    return absences;
}

export async function getTeacherCovers(teacherId: string, startDate: Date, endDate: Date) {
    const session = await auth();
    // if (!session?.user) { ... }

    const covers = await prisma.substitution.findMany({
        where: {
            substituteTeacherId: teacherId,
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            schedule: {
                include: {
                    class: true,
                    teacher: true // To see who they are covering for
                }
            }
        }
    });

    return covers;
}

export async function clearDailySubstitutions(teacherId: string, date: Date) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const d = new Date(date);
    const startOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

    // Find all substitutions for this teacher on this day
    await prisma.substitution.deleteMany({
        where: {
            schedule: {
                teacherId: teacherId
            },
            date: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    });

    revalidatePath('/', 'layout');
    return { success: true };
}
