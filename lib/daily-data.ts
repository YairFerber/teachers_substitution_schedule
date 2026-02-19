import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, getDay } from 'date-fns';

export async function getDailyData(date: Date) {
    const dayOfWeek = getDay(date);
    const start = startOfDay(date);
    const end = endOfDay(date);

    // 1. Fetch All Teachers
    const allTeachers = await prisma.teacher.findMany({
        orderBy: { lastName: 'asc' },
        select: { id: true, firstName: true, lastName: true, type: true }
    });

    // 2. Fetch Schedules for this Day of Week for ALL teachers
    const schedules = await prisma.schedule.findMany({
        where: { dayOfWeek: dayOfWeek },
        include: { class: true }
    });

    // 3. Fetch Substitutions for this specific Date
    const substitutions = await prisma.substitution.findMany({
        where: {
            date: {
                gte: start,
                lte: end,
            }
        },
        include: {
            schedule: true,
            substituteTeacher: true
        }
    });

    return { allTeachers, schedules, substitutions };
}
