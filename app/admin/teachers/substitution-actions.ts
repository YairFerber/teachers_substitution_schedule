'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function markAbsence(scheduleId: string, date: Date) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    // Normalize date to ensure we match the "day" regardless of time component quirks
    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

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
                substituteTeacherId: null
            }
        });
    } else {
        await prisma.substitution.create({
            data: {
                scheduleId,
                date: startOfDay, // Save as standardized start of day
                status: 'ABSENT'
            }
        });
    }

    revalidatePath('/admin/teachers');
    revalidatePath('/admin/daily');
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

    revalidatePath('/admin/teachers');
    revalidatePath('/admin/daily');
    return { success: true };
}

export async function findAvailableTeachers(date: Date, hourIndex: number) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const dayOfWeek = date.getDay(); // 0-6

    // Normalize date for substitution check
    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

    // Get all teachers
    const allTeachers = await prisma.teacher.findMany({
        orderBy: { lastName: 'asc' }
    });

    // 1. Get teachers busy with their REGULAR schedule
    const busySchedules = await prisma.schedule.findMany({
        where: {
            dayOfWeek,
            hourIndex
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

    busySubstitutes.forEach(s => {
        if (s.substituteTeacherId) busyTeacherIds.add(s.substituteTeacherId);
    });

    // Filter out busy teachers
    const availableTeachers = allTeachers.filter(t => !busyTeacherIds.has(t.id));

    return availableTeachers;
}

export async function assignSubstitute(substitutionId: string, substituteTeacherId: string) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    await prisma.substitution.update({
        where: { id: substitutionId },
        data: {
            substituteTeacherId,
            status: 'COVERED'
        }
    });

    revalidatePath('/admin/teachers');
    revalidatePath('/admin/daily');
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

    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

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

    revalidatePath('/admin/daily');
    revalidatePath('/admin/teachers');
    return { success: true };
}
