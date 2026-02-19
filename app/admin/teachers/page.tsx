import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import TeacherRow from './TeacherRow';
import AddTeacherButton from './AddTeacherButton';

export default async function AdminTeachersPage() {
    const session = await auth();

    // Protect Route - Admin Only
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        redirect('/');
    }

    // List only users with role TEACHER
    const users = await prisma.user.findMany({
        where: { role: 'TEACHER' },
        include: { teacher: true },
        orderBy: { name: 'asc' }
    });

    const regularTeachers = users.filter((u: any) => u.teacher?.type !== 'SUBSTITUTE');
    const substituteTeachers = users.filter((u: any) => u.teacher?.type === 'SUBSTITUTE');

    const UserTable = ({ title, usersList }: { title: string, usersList: typeof users }) => (
        <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 px-1">{title}</h2>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PIN Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {usersList.map((user: any) => (
                                <TeacherRow key={user.id} user={user} />
                            ))}
                            {usersList.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No teachers found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <main className="min-h-screen p-8 bg-gray-50 text-gray-900">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Teacher Management (Admin)</h1>
                    <div className="flex gap-4">
                        <AddTeacherButton />
                        <a href="/admin/daily" className="px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 font-medium">Daily Organizer 📅</a>
                        <a href="/admin/reports" className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium">Monthly Reports 📊</a>
                        <a href="/admin/data" className="px-4 py-2 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 font-medium">Data 💾</a>
                        <a href="/" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700">Back to Schedule</a>
                    </div>
                </div>

                <UserTable title="Regular Teachers" usersList={regularTeachers} />
                <UserTable title="Substitute Teachers" usersList={substituteTeachers} />

            </div>
        </main>
    );
}
