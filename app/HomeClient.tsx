'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TeacherSelector from './components/TeacherSelector';
import ScheduleGrid from './components/ScheduleGrid';
import SignOutButton from './components/SignOutButton';
import { Teacher, ScheduleItem, Period } from './types';

interface HomeClientProps {
    userRole?: string;
    teacherId?: string;
}

export default function HomeClient({ userRole, teacherId }: HomeClientProps) {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [periods, setPeriods] = useState<Period[]>([]);
    const [loadingSchedule, setLoadingSchedule] = useState(false);

    // Auto-select logged-in teacher
    useEffect(() => {
        if (userRole === 'TEACHER' && teacherId) {
            setSelectedTeacherId(teacherId);
        }
    }, [userRole, teacherId]);

    // Fetch Teachers and Periods on Mount
    useEffect(() => {
        async function fetchInitialData() {
            try {
                const [teachersRes, periodsRes] = await Promise.all([
                    fetch('/api/teachers'),
                    fetch('/api/periods')
                ]);

                if (teachersRes.ok) {
                    const data = await teachersRes.json();
                    setTeachers(data);
                }

                if (periodsRes.ok) {
                    const data = await periodsRes.json();
                    setPeriods(data);
                }
            } catch (error) {
                console.error('Failed to fetch initial data', error);
            }
        }
        fetchInitialData();
    }, []);

    // Fetch Schedule when Teacher Selected
    useEffect(() => {
        if (!selectedTeacherId) {
            setSchedule([]);
            return;
        }

        async function fetchSchedule() {
            setLoadingSchedule(true);
            try {
                const res = await fetch(`/api/schedule/${selectedTeacherId}`);
                if (res.ok) {
                    const data = await res.json();
                    setSchedule(data);
                }
            } catch (error) {
                console.error('Failed to fetch schedule', error);
            } finally {
                setLoadingSchedule(false);
            }
        }

        fetchSchedule();
    }, [selectedTeacherId]);

    return (
        <main className="min-h-screen p-8 bg-gray-50 flex flex-col items-center">
            <div className="w-full max-w-7xl">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Teacher Schedule Organizer</h1>
                    <div className="flex items-center gap-4">
                        {userRole === 'ADMIN' && (
                            <Link href="/admin/teachers" className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-full transition-colors">
                                Admin Dashboard
                            </Link>
                        )}
                        <SignOutButton />
                    </div>
                </div>

                {/* Only Admin sees the selector */}
                {userRole === 'ADMIN' && (
                    <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                        <TeacherSelector
                            teachers={teachers}
                            selectedTeacherId={selectedTeacherId}
                            onSelect={setSelectedTeacherId}
                        />
                    </div>
                )}

                {selectedTeacherId && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700 text-right" dir="rtl">
                            מערכת שעות: {teachers.find(t => t.id === selectedTeacherId)?.firstName} {teachers.find(t => t.id === selectedTeacherId)?.lastName}
                        </h2>
                        <ScheduleGrid schedule={schedule} periods={periods} loading={loadingSchedule} />
                    </div>
                )}

                {!selectedTeacherId && userRole === 'ADMIN' && (
                    <div className="text-center text-gray-400 mt-12">
                        Please select a teacher to view their schedule.
                    </div>
                )}
            </div>
        </main>
    );
}
