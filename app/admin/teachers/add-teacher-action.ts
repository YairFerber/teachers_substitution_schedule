'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function addTeacher(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    type: string; // 'REGULAR' | 'SUBSTITUTE'
}) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const safeEmail = data.email && data.email.trim() !== '' ? data.email.trim() : null;
    const safePhone = data.phone && data.phone.trim() !== '' ? data.phone.trim() : null;

    // 1. Create Teacher Record
    const teacher = await prisma.teacher.create({
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: safeEmail,
            phone: safePhone,
            type: data.type,
        }
    });

    // 2. Generate Credentials
    // Username: First Last (make unique if needed, simple for now)
    // PIN: Random 4 digits
    const username = `${data.firstName} ${data.lastName}`;
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPin = await bcrypt.hash(pin, 10);

    // 3. Create User Account
    // Handle duplicate username simply by appending random number if needed?
    // For now, let's assume names are unique enough or let it fail (Prisma error) and user retry.
    // Better: check existence.
    let finalUsername = username;
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
        finalUsername = `${username} ${Math.floor(Math.random() * 100)}`;
    }

    await prisma.user.create({
        data: {
            name: `${data.firstName} ${data.lastName}`,
            username: finalUsername,
            email: safeEmail, // Can be null or duplicate? Schema says unique.
            // If email is shared or fake, might be issue.
            // Let's use the provided email. If empty, null.
            password: hashedPin,
            displayPin: pin,
            role: 'TEACHER',
            teacher: { connect: { id: teacher.id } }
        }
    });

    revalidatePath('/admin/teachers');
    return { success: true, pin, username: finalUsername };
}
