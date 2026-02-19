'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function updateScheduleItem(
    teacherId: string,
    dayOfWeek: number,
    hourIndex: number,
    data: {
        subject?: string;
        type: string;
        className?: string; // Changed from classId
    }
) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    // Resolve Class ID from Name
    let classId: string | null = null;
    if (data.className && data.className.trim() !== '') {
        const trimmedName = data.className.trim();
        // Find existing class or create new one
        const existingClass = await prisma.class.findFirst({
            where: { name: trimmedName }
        });

        if (existingClass) {
            classId = existingClass.id;
        } else {
            const newClass = await prisma.class.create({
                data: { name: trimmedName }
            });
            classId = newClass.id;
        }
    }

    // Upsert the schedule item
    // We need to find if one exists for this slot
    // The schema doesn't strictly enforce unique constraint on (teacherId, day, hour) but it should logically be unique.
    // Let's use findFirst then update or create.

    const existing = await prisma.schedule.findFirst({
        where: {
            teacherId,
            dayOfWeek,
            hourIndex
        }
    });

    if (existing) {
        await prisma.schedule.update({
            where: { id: existing.id },
            data: {
                subject: data.subject,
                type: data.type,
                classId: classId
            }
        });
    } else {
        await prisma.schedule.create({
            data: {
                teacherId,
                dayOfWeek,
                hourIndex,
                subject: data.subject,
                type: data.type,
                classId: classId
            }
        });
    }

    revalidatePath(`/admin/teachers/${teacherId}`);
    return { success: true };
}

export async function deleteScheduleItem(teacherId: string, dayOfWeek: number, hourIndex: number) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const existing = await prisma.schedule.findFirst({
        where: {
            teacherId,
            dayOfWeek,
            hourIndex
        }
    });

    if (existing) {
        await prisma.schedule.delete({
            where: { id: existing.id }
        });
    }

    revalidatePath(`/admin/teachers/${teacherId}`);
    return { success: true };
}
