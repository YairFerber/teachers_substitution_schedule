import 'dotenv/config';
import prisma from './lib/prisma';

async function main() {
    console.log("--- Testing Teacher Fetch Logic ---");
    const teachers = await prisma.teacher.findMany({
        orderBy: { lastName: 'asc' },
        select: { id: true, firstName: true, lastName: true }
    });
    console.log(`Found ${teachers.length} teachers.`);
    if (teachers.length > 0) {
        console.log("First teacher:", teachers[0]);
        console.log("--- Testing Schedule Fetch Logic ---");
        const teacherId = teachers[0].id;
        const schedule = await prisma.schedule.findMany({
            where: { teacherId },
            include: { class: true, substitutions: true },
            orderBy: [{ dayOfWeek: 'asc' }, { hourIndex: 'asc' }]
        });
        console.log(`Found ${schedule.length} schedule items for first teacher.`);
        if (schedule.length > 0) {
            console.log("First schedule item:", JSON.stringify(schedule[0], null, 2));
        }
    } else {
        console.log("No teachers found to test schedule fetch.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        // await prisma.$disconnect(); // standardized client doesn't need explicit disconnect in script usually, but good practice
    });
