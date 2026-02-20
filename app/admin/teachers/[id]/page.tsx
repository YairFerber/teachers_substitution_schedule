import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import TeacherProfileCard from '../TeacherProfileCard';
import TeacherScheduleManager from '../TeacherScheduleManager';
import MonthlySubstitutionReport from '../MonthlySubstitutionReport';

export default async function TeacherProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;

    // Protect Route - Admin Only
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        redirect('/');
    }

    // Fetch Teacher, Schedule, Periods, AND Classes
    const [teacher, schedule, periods, classes] = await Promise.all([
        prisma.teacher.findUnique({
            where: { id },
            include: { user: true }
        }),
        prisma.schedule.findMany({
            where: { teacherId: id },
            include: {
                class: true,
                substitutions: true
            },
            orderBy: [{ dayOfWeek: 'asc' }, { hourIndex: 'asc' }]
        }),
        prisma.period.findMany({ orderBy: { index: 'asc' } }),
        prisma.class.findMany({ orderBy: { name: 'asc' } }) // Fetch classes
    ]);

    if (!teacher) {
        notFound();
    }

    // Convert keys for ScheduleGrid/Manager
    const formattedSchedule: any[] = schedule.map((s: any) => ({
        ...s,
    }));

    // Convert Periods
    const formattedPeriods = periods.map((p: any) => ({
        index: p.index,
        startTime: p.startTime,
        endTime: p.endTime
    }));

    return (
        <main className="min-h-screen p-8 bg-gray-50 text-gray-900 flex flex-col items-center">
            <div className="w-full max-w-7xl">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Teacher Profile</h1>
                    <a href="/admin/teachers" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700">Back to Dashboard</a>
                </div>

                {/* Bio Card */}
                <TeacherProfileCard teacher={teacher as any} />

                {/* Conditional View Based on Teacher Type */}
                {(teacher as any).type === 'SUBSTITUTE' ? (
                    <MonthlySubstitutionReport teacherId={id} />
                ) : (
                    <>
                        <TeacherScheduleManager
                            teacherId={id}
                            schedule={formattedSchedule}
                            periods={formattedPeriods}
                            classes={classes}
                        />
                        <div className="mt-12 border-t pt-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 text-right" dir="rtl">דוח מילוי מקום (אישי)</h3>
                            <MonthlySubstitutionReport teacherId={id} />
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
