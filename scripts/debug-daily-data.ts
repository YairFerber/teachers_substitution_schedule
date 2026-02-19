
import prisma from '@/lib/prisma';
import { addDays, getDay, format } from 'date-fns';

async function main() {
    // 1. Calculate Target Date (Tomorrow)
    const targetDate = addDays(new Date(), 1);
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    const dayOfWeek = getDay(targetDate);

    console.log(`Debug Date: ${dateStr}, Day of Week: ${dayOfWeek}`);

    // 2. Fetch Schedules
    const schedules = await prisma.schedule.findMany({
        where: { dayOfWeek: dayOfWeek },
        include: { class: true }
    });
    console.log(`Found ${schedules.length} schedules.`);

    // Sample a few
    if (schedules.length > 0) {
        console.log('Sample Schedule:', schedules[0]);
    } else {
        console.log('WARNING: No schedules found. Check DB content or DayOfWeek mapping.');
        // Check ALL schedules to see what days exist
        const all = await prisma.schedule.findMany({ take: 5 });
        console.log('Random schedules from DB:', all);
    }

    // 3. Fetch Substitutions
    const substitutions = await prisma.substitution.findMany({
        where: {
            date: {
                gte: new Date(dateStr + 'T00:00:00.000Z'),
                lt: new Date(dateStr + 'T23:59:59.999Z'),
            }
        }
    });
    console.log(`Found ${substitutions.length} substitutions for ${dateStr}.`);
}

main();
