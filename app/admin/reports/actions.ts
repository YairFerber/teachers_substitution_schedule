'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function getMonthlySubstitutions(date: Date) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const substitutions = await prisma.substitution.findMany({
        where: {
            date: {
                gte: start,
                lte: end
            },
            status: 'COVERED' // Only show covered substitutions in report? Or all? User said "full monthly substitution report", implying active ones. I'll stick to COVERED for now as "Who worked".
            // Actually, maybe show ABSENT too if they want to see unfilled? "Grouped by Substitute" implies successful subs.
            // Let's filter for substituteTeacherId not null.
        },
        include: {
            substituteTeacher: true,
            schedule: {
                include: {
                    teacher: true, // Original teacher
                    class: true
                }
            }
        },
        orderBy: {
            date: 'asc'
        }
    });

    return substitutions;
}
