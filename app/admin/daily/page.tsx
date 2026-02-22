import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { format, addDays, getDay, startOfDay, endOfDay } from 'date-fns';
import DailyGrid from './DailyGrid';

export const dynamic = 'force-dynamic';

export default async function DailySubstitutionPage({
    searchParams,
}: {
    searchParams: { date?: string };
}) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        redirect('/');
    }

    // Await searchParams just in case (Next.js 15 compat, though 14 is sync usually)
    // But mainly to ensure we have the latest.
    const params = await searchParams; // In Next 15 this is a promise. In 14 it's an object. 
    // Typescript might complain if we treat it as a promise if it's not defined as such in props, 
    // but usually in App Router it's safer to treat as potentially async or just access.
    // Let's just access it directly but ensure dynamic const is set.

    // Default Date Logic:
    let targetDate = new Date();
    if (params?.date) {
        // Force noon to avoid timezone rolling to previous day
        targetDate = new Date(params.date + 'T12:00:00');
    } else {
        // Default to Today!
        targetDate = new Date();
        targetDate.setHours(12, 0, 0, 0);
    }

    const dateStr = format(targetDate, 'yyyy-MM-dd');
    const dayOfWeek = getDay(targetDate); // 0-6

    console.log(`[DailyPage] Date: ${dateStr}, DayOfWeek: ${dayOfWeek}`);

    // DB Date Range (Strict UTC match to align with substitution-actions.ts)
    const [year, month, day] = dateStr.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    console.log(`[DailyPage] Querying range in UTC: ${start.toISOString()} to ${end.toISOString()}`);

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
    // IMPORTANT: Include 'schedule' to know the hourIndex!
    const substitutions = await prisma.substitution.findMany({
        where: {
            date: {
                gte: start,
                lte: end,
            }
        },
        include: {
            schedule: {
                include: {
                    teacher: true
                }
            },
            substituteTeacher: true,
        }
    });

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-sm z-20">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Daily Substitution Organizer 📅</h1>
                    <div className="flex gap-3">
                        <a href="/admin/teachers" className="text-sm font-medium text-gray-500 hover:text-gray-700">Manage Teachers</a>
                        <a href="/" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-bold">Back to Dashboard</a>
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                <DailyGrid
                    key={dateStr} // Force remount on date change to reset state
                    dateStr={dateStr}
                    allTeachers={allTeachers}
                    initialSchedules={schedules as any}
                    initialSubstitutions={substitutions as any} // Cast because we added schedule
                />
            </div>
        </main>
    );
}
