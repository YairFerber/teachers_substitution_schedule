'use client';

import React, { useState, useEffect } from 'react';
import ScheduleGrid from '@/app/components/ScheduleGrid';
import EditScheduleModal from './EditScheduleModal';
import AbsenceModal from './AbsenceModal';
import { ScheduleItem, Period } from '@/app/types';
import { updateScheduleItem, deleteScheduleItem } from './schedule-actions';
import { getTeacherAbsences, getTeacherCovers } from './substitution-actions';
import { useRouter } from 'next/navigation';
import { startOfWeek, addDays, format, addWeeks, subWeeks } from 'date-fns';

interface TeacherScheduleManagerProps {
    teacherId: string;
    schedule: ScheduleItem[];
    periods: Period[];
    classes: { id: string; name: string }[];
}

export default function TeacherScheduleManager({ teacherId, schedule, periods, classes }: TeacherScheduleManagerProps) {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'TEMPLATE' | 'WEEKLY'>('TEMPLATE');
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));

    // State
    const [selectedSlot, setSelectedSlot] = useState<any>(null); // Extended slot info
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);

    const [substitutions, setSubstitutions] = useState<any[]>([]);

    // Fetch substitutions when week changes
    useEffect(() => {
        if (viewMode === 'WEEKLY') {
            const fetchSubs = async () => {
                const startStr = format(currentWeekStart, 'yyyy-MM-dd');
                const endStr = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');
                const [absences, covers] = await Promise.all([
                    getTeacherAbsences(teacherId, new Date(startStr), new Date(endStr)),
                    getTeacherCovers(teacherId, new Date(startStr), new Date(endStr))
                ]);
                setSubstitutions([...absences, ...covers]);
            };
            fetchSubs();
        } else {
            setSubstitutions([]);
        }
    }, [viewMode, currentWeekStart, teacherId]);

    const handlePeriodClick = (dayIndex: number, hourIndex: number, item?: ScheduleItem) => {
        if (viewMode === 'TEMPLATE') {
            // Edit Template Mode
            setSelectedSlot({ day: dayIndex, hour: hourIndex, item });
            setIsEditModalOpen(true);
        } else {
            // Weekly/Absence Mode
            // Find specific date
            const localDate = addDays(currentWeekStart, dayIndex);
            // Create a pure YYYY-MM-DD string, then parse it back to Date so it equates to UTC midnight in the browser
            const dateStr = format(localDate, 'yyyy-MM-dd');
            const pureUtcDate = new Date(dateStr);

            const sub = substitutions.find(s => {
                const subDateStr = new Date(s.date).toISOString().split('T')[0];
                // Match by scheduleId (regular items) or by substitution id (ad-hoc items where item.id = sub.id)
                if (item && s.scheduleId === item.id && subDateStr === dateStr) return true;
                if (item && s.id === item.id && subDateStr === dateStr) return true;
                if (!item && s.isExtra && s.schedule?.hourIndex === hourIndex && subDateStr === dateStr && s.substituteTeacherId === teacherId) return true;
                return false;
            }) || (item as any)?.substitutions?.[0]; // Fallback: use embedded substitution from display items

            // Prepare slot info for modal
            setSelectedSlot({
                teacherId: teacherId,
                scheduleId: sub?.scheduleId || item?.id,
                date: pureUtcDate,
                hourIndex: hourIndex,
                dayName: format(localDate, 'EEEE'),
                hourTime: periods.find(p => p.index === hourIndex)?.startTime || hourIndex,
                currentStatus: sub?.status,
                substituteName: sub?.substituteTeacher ? `${sub.substituteTeacher.firstName} ${sub.substituteTeacher.lastName}` : undefined,
                substitutionId: sub?.id,
                isExtra: sub?.isExtra,
                absenceType: sub?.absenceType
            });
            setIsAbsenceModalOpen(true);
        }
    };

    // --- Template Actions ---
    const handleTemplateSave = async (data: { subject: string; className: string; type: string }) => {
        if (!selectedSlot) return;
        await updateScheduleItem(teacherId, selectedSlot.day, selectedSlot.hour, data);
        router.refresh();
    };

    const handleTemplateDelete = async () => {
        if (!selectedSlot) return;
        await deleteScheduleItem(teacherId, selectedSlot.day, selectedSlot.hour);
        router.refresh();
    };

    // --- Render Logic ---
    // Merge template with substitutions for display
    const displaySchedule = React.useMemo(() => {
        if (viewMode === 'TEMPLATE') return schedule;

        const processed = schedule.map(item => {
            const itemDateStr = format(addDays(currentWeekStart, item.dayOfWeek), 'yyyy-MM-dd');
            const sub = substitutions.find(s => {
                const subDateStr = new Date(s.date).toISOString().split('T')[0];
                return s.scheduleId === item.id && subDateStr === itemDateStr;
            });

            let finalItem = { ...item };

            if (sub && sub.status === 'ABSENT') {
                finalItem = { ...finalItem, type: 'ABSENT_DISPLAY' as const, subject: 'ABSENT' };
            }
            if (sub && sub.status === 'COVERED' && sub.schedule?.teacherId === teacherId) {
                // Return new style: Red BG with Green indicator (or Yellow for unpaid)
                const coverType = sub.isPaid === false ? 'COVERED_ABSENCE_DISPLAY_NOPAY' : 'COVERED_ABSENCE_DISPLAY';
                finalItem = { ...finalItem, type: coverType as any, subject: `Cover: ${sub.substituteTeacher?.firstName}` };
            }
            if (sub && sub.isExtra && sub.substituteTeacherId === teacherId) {
                // If the original teacher is doing extra here, append badge
                finalItem = { ...finalItem, subject: finalItem.subject ? `${finalItem.subject} (+ Extra)` : 'Extra Class' };
            }
            return finalItem;
        });

        // Add Covers (where I am the substitute or doing an ad-hoc extra class)
        // Note: we exclude covers that map to my *own* regular schedule because those are handled above
        const covers = substitutions.filter(s =>
            s.substituteTeacherId === teacherId &&
            (s.status === 'COVERED' || s.isExtra) &&
            s.schedule?.teacherId !== teacherId
        );
        const coverItems = covers.map(cover => ({
            id: cover.id,
            teacherId: teacherId, // It's effectively mine now
            dayOfWeek: cover.schedule.dayOfWeek,
            hourIndex: cover.schedule.hourIndex,
            classId: cover.schedule.classId,
            class: cover.schedule.class,
            subject: `Sub: ${cover.schedule.subject || 'Class'} (${cover.schedule.teacher?.lastName})`,
            type: (cover.isExtra ? 'STAY' : (cover.isPaid === false ? 'COVERED_DISPLAY_NOPAY' : 'COVERED_DISPLAY')) as any,
            substitutions: [cover]
        }));

        // Add ad-hoc extra classes (where we created a FREE schedule just to hold the substitution)
        const adhocExtras = substitutions.filter(s =>
            s.substituteTeacherId === teacherId &&
            s.isExtra &&
            s.schedule?.teacherId === teacherId &&
            s.schedule?.type === 'FREE'
        );
        const adhocItems = adhocExtras.map(extra => ({
            id: extra.id,
            teacherId: teacherId,
            dayOfWeek: extra.schedule.dayOfWeek,
            hourIndex: extra.schedule.hourIndex,
            classId: extra.schedule.classId,
            class: extra.schedule.class,
            subject: `Extra: ${extra.notes || 'Ad-hoc'}`,
            type: 'EXTRA_CLASS_DISPLAY' as any,
            substitutions: [extra]
        }));

        return [...processed, ...coverItems, ...adhocItems];
    }, [schedule, substitutions, viewMode, currentWeekStart, teacherId]);


    const getDayName = (idx: number) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][idx] || '';

    return (
        <>
            <div className="animate-fade-in-up">
                <div className="flex justify-between items-end mb-4">
                    <div className="flex items-center gap-4">
                        {/* View Switcher */}
                        <div className="flex bg-gray-200 rounded p-1">
                            <button
                                onClick={() => setViewMode('TEMPLATE')}
                                className={`px-4 py-1 rounded text-sm font-medium ${viewMode === 'TEMPLATE' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                            >
                                Weekly Template
                            </button>
                            <button
                                onClick={() => setViewMode('WEEKLY')}
                                className={`px-4 py-1 rounded text-sm font-medium ${viewMode === 'WEEKLY' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                            >
                                Manage Substitutions
                            </button>
                        </div>

                        {/* Week Navigator (Only visible in Weekly mode) */}
                        {viewMode === 'WEEKLY' && (
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2 py-1 shadow-sm">
                                <button onClick={() => setCurrentWeekStart(d => subWeeks(d, 1))} className="text-gray-500 hover:text-black">&lt;</button>
                                <span className="text-sm font-bold min-w-[150px] text-center">
                                    {format(currentWeekStart, 'dd/MM')} - {format(addDays(currentWeekStart, 5), 'dd/MM/yyyy')}
                                </span>
                                <button onClick={() => setCurrentWeekStart(d => addWeeks(d, 1))} className="text-gray-500 hover:text-black">&gt;</button>
                            </div>
                        )}
                    </div>

                    <h2 className="text-xl font-semibold text-gray-700 text-right" dir="rtl">
                        {viewMode === 'TEMPLATE' ? 'מערכת שעות קבועה' : 'שינויים והחלפות'}
                    </h2>
                </div>

                <ScheduleGrid
                    schedule={displaySchedule}
                    periods={periods}
                    onPeriodClick={handlePeriodClick}
                />
            </div>

            {/* Template Edit Modal */}
            {isEditModalOpen && selectedSlot && (
                <EditScheduleModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleTemplateSave}
                    onDelete={handleTemplateDelete}
                    initialData={selectedSlot.item}
                    slotInfo={{
                        day: getDayName(selectedSlot.day),
                        hour: periods.find(p => p.index === selectedSlot.hour)?.startTime
                            ? `${selectedSlot.hour} (${periods.find(p => p.index === selectedSlot.hour)?.startTime})`
                            : selectedSlot.hour.toString()
                    }}
                />
            )}

            {/* Absence Management Modal */}
            {isAbsenceModalOpen && selectedSlot && (
                <AbsenceModal
                    isOpen={isAbsenceModalOpen}
                    onClose={() => setIsAbsenceModalOpen(false)}
                    slotInfo={selectedSlot}
                    onSuccess={() => {
                        // Refresh subs from server
                        const startStr = format(currentWeekStart, 'yyyy-MM-dd');
                        const endStr = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');
                        Promise.all([
                            getTeacherAbsences(teacherId, new Date(startStr), new Date(endStr)),
                            getTeacherCovers(teacherId, new Date(startStr), new Date(endStr))
                        ]).then(([absences, covers]) => {
                            setSubstitutions([...absences, ...covers]);
                        });
                        // Also refresh server component data (e.g. schedule prop) to remove orphaned ad-hoc schedules
                        router.refresh();
                    }}
                />
            )}
        </>
    );
}
