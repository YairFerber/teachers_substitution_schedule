'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function resetPin(userId: string) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPin = await bcrypt.hash(newPin, 10);

    await prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPin,
            displayPin: newPin,
        },
    });

    return newPin;
}

export async function updateTeacher(teacherId: string, data: { firstName: string; lastName: string; email: string; phone: string; username: string }) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const safeEmail = data.email && data.email.trim() !== '' ? data.email.trim() : null;
    const safePhone = data.phone && data.phone.trim() !== '' ? data.phone.trim() : null;

    await prisma.teacher.update({
        where: { id: teacherId },
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: safeEmail,
            phone: safePhone,
        },
    });

    // Also update User name/email/username if linked
    const linkedUser = await prisma.user.findFirst({
        where: { teacher: { id: teacherId } }
    });
    if (linkedUser) {
        await prisma.user.update({
            where: { id: linkedUser.id },
            data: {
                name: `${data.firstName} ${data.lastName}`,
                username: data.username,
                email: safeEmail,
            }
        });
    }

    return { success: true };
}

export async function deleteTeacher(teacherId: string) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    // Delete in order:
    // 1. Schedules
    // 2. Substitutions (as substitute)
    // 3. The Teacher record
    // 4. The linked User record (optional, but cleaner)

    // Find linked user first
    const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
        include: { user: true }
    });

    if (!teacher) return { success: false, error: 'Teacher not found' };

    await prisma.$transaction([
        prisma.schedule.deleteMany({ where: { teacherId } }),
        prisma.substitution.deleteMany({ where: { substituteTeacherId: teacherId } }),
        prisma.teacher.delete({ where: { id: teacherId } }),
    ]);

    // Delete user if it exists and is a teacher (double check to not delete admin by mistake, though admin shouldn't be linked to a teacher record usually)
    // Our seed created Users with role TEACHER linked.
    if (teacher.userId) {
        await prisma.user.delete({ where: { id: teacher.userId } });
    }

    revalidatePath('/admin/teachers');
    return { success: true };
}
