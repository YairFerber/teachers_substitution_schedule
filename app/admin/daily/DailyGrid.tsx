'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { format, addDays, subDays, parseISO, getDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import DailySubSelector from './DailySubSelector';
import { markAbsence, assignSubstitute, cancelAbsence, clearDailySubstitutions, toggleExtraClass } from '@/app/admin/teachers/substitution-actions';

interface Teacher {
    id: string;
    firstName: string;
    lastName: string;
    type: string;
}

interface Schedule {
    id: string;
    teacherId: string;
    dayOfWeek: number;
    hourIndex: number;
    classId: string | null;
    subject: string | null;
    type: string;
    class?: { name: string };
}

interface Substitution {
    id: string;
    scheduleId: string;
    date: Date;
    substituteTeacherId: string | null;
    status: string;
    isExtra?: boolean;
    notes?: string;
    absenceType?: string;
    schedule?: Schedule; // Now included from server
}

interface DailyGridProps {
    dateStr: string;
    allTeachers: Teacher[];
    initialSchedules: Schedule[];
    initialSubstitutions: Substitution[];
}

export default function DailyGrid({ dateStr, allTeachers, initialSchedules, initialSubstitutions }: DailyGridProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // --- State ---
    const [internalDate, setInternalDate] = useState(dateStr);

    // Track manually removed teachers so they don't pop back immediately 
    // when initialSubstitutions triggers a re-render from the server.
    const [manuallyRemoved, setManuallyRemoved] = useState<string[]>([]);

    const [visibleTeacherIds, setVisibleTeacherIds] = useState<string[]>([]);

    // Add Teacher State
    const [isAddingTeacher, setIsAddingTeacher] = useState(false);
    const [teacherSearch, setTeacherSearch] = useState('');
    const addTeacherRef = useRef<HTMLDivElement>(null);

    // Selection State
    const [selectedCell, setSelectedCell] = useState<{ teacherId: string, hourIndex: number } | null>(null);

    // --- Effects ---

    useEffect(() => {
        setInternalDate(dateStr);
    }, [dateStr]);

    useEffect(() => {
        const involvedTeacherIds = new Set<string>();
        initialSubstitutions.forEach(sub => {
            let teacherId = '';
            if (sub.schedule) {
                teacherId = sub.schedule.teacherId;
            } else {
                const sch = initialSchedules.find(s => s.id === sub.scheduleId);
                if (sch) teacherId = sch.teacherId;
            }
            if (teacherId) involvedTeacherIds.add(teacherId);
        });

        setVisibleTeacherIds(prev => {
            const newSet = new Set(prev);
            involvedTeacherIds.forEach(id => newSet.add(id));

            // Filter out any teachers the user explicitly clicked 'X' on
            const finalArray = Array.from(newSet).filter(id => !manuallyRemoved.includes(id));
            return finalArray;
        });
    }, [initialSubstitutions, initialSchedules, manuallyRemoved]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (addTeacherRef.current && !addTeacherRef.current.contains(event.target as Node)) {
                setIsAddingTeacher(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Helpers ---
    const daysInHebrew = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const currentDayName = daysInHebrew[getDay(parseISO(internalDate))];

    // --- Logic for Availability ---
    const getBusyTeachersForHour = (hour: number) => {
        const busySet = new Set<string>();
        // 1. Regular Teaching at this hour
        initialSchedules.forEach(s => {
            if (s.hourIndex === hour) busySet.add(s.teacherId);
        });
        // 2. Substituting at this hour
        initialSubstitutions.forEach(sub => {
            // We need to know which HOUR this sub is for. 
            // Either sub.schedule.hourIndex OR finding it in initialSchedules
            const hIndex = sub.schedule ? sub.schedule.hourIndex : initialSchedules.find(s => s.id === sub.scheduleId)?.hourIndex;
            if (hIndex === hour && sub.substituteTeacherId) {
                busySet.add(sub.substituteTeacherId);
            }
        });
        return busySet;
    };

    // --- Handlers ---

    const handleDateChange = (val: string) => {
        setInternalDate(val);
        startTransition(() => {
            router.push(`/admin/daily?date=${val}`);
        });
    };

    const handlePrevDay = () => handleDateChange(format(subDays(parseISO(internalDate), 1), 'yyyy-MM-dd'));
    const handleNextDay = () => handleDateChange(format(addDays(parseISO(internalDate), 1), 'yyyy-MM-dd'));

    const handleAddTeacher = (teacherId: string) => {
        // If they were previously removed, forget that they were removed
        setManuallyRemoved(prev => prev.filter(id => id !== teacherId));

        setVisibleTeacherIds(prev => {
            if (prev.includes(teacherId)) return prev;
            return [...prev, teacherId];
        });
        setIsAddingTeacher(false);
        setTeacherSearch('');
    };



    // ...

    const handleRemoveTeacher = async (teacherId: string) => {
        if (!confirm('האם אתה בטוח? פעולה זו תמחק את כל ההיעדרויות וההחלפות של המורה ליום זה.')) {
            return;
        }

        // Optimistic update
        setVisibleTeacherIds(visibleTeacherIds.filter(id => id !== teacherId));
        setManuallyRemoved(prev => [...prev, teacherId]);

        // Server action
        await clearDailySubstitutions(teacherId, new Date(internalDate));
        router.refresh();
    };

    // Server Actions Wrappers
    const onMarkAbsent = async (scheduleId: string) => {
        await markAbsence(scheduleId, new Date(internalDate)); // Pass pure date string? server expects Date object
        // Refresh happens via router.refresh in server action usually, but we need to trigger it here?
        // Server action calls revalidatePath. We just need to wait.
        router.refresh();
    };

    const onAssignSub = async (subId: string, teacherId: string) => {
        await assignSubstitute(subId, teacherId);
        router.refresh();
        setSelectedCell(null);
    };

    const onCancel = async (subId: string) => {
        await cancelAbsence(subId);
        router.refresh();
    };

    const onToggleExtraClass = async (teacherId: string, hourIndex: number, isExtra: boolean) => {
        await toggleExtraClass(teacherId, new Date(internalDate), hourIndex, isExtra, 'Added from Daily Grid');
        router.refresh();
    };

    // --- Render ---
    const filteredTeachers = allTeachers
        .filter(t => !visibleTeacherIds.includes(t.id))
        .filter(t =>
            t.firstName.toLowerCase().includes(teacherSearch.toLowerCase()) ||
            t.lastName.toLowerCase().includes(teacherSearch.toLowerCase())
        );

    return (
        <div className="flex flex-col h-full" dir="rtl">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 z-30 relative no-print">
                <div className="flex gap-2 relative" ref={addTeacherRef}>
                    <button
                        onClick={() => setIsAddingTeacher(!isAddingTeacher)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 font-medium transition-all flex items-center gap-2"
                    >
                        <span>+ הוסף מורה</span>
                    </button>

                    {isAddingTeacher && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-white shadow-xl rounded-xl border border-gray-200 p-3 z-50 text-right">
                            <input
                                type="text"
                                placeholder="חפש מורה..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 mb-2 text-right"
                                autoFocus
                                value={teacherSearch}
                                onChange={e => setTeacherSearch(e.target.value)}
                            />
                            <div className="max-h-60 overflow-y-auto space-y-1">
                                {filteredTeachers.length === 0 ? (
                                    <div className="text-gray-400 text-xs text-center py-2">לא נמצאו מורים</div>
                                ) : (
                                    filteredTeachers.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleAddTeacher(t.id)}
                                            className="w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md transition-colors flex justify-between items-center"
                                        >
                                            <span>{t.lastName} {t.firstName}</span>
                                            {t.type === 'SUBSTITUTE' && <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">מ"מ</span>}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={handleNextDay} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors" disabled={isPending}>
                        ◀
                    </button>
                    <div className="flex flex-col items-center">
                        <label className="text-sm text-gray-500 font-semibold uppercase tracking-wider">יום {currentDayName}</label>
                        <input
                            type="date"
                            value={internalDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="font-bold text-lg text-gray-800 border-none focus:ring-0 cursor-pointer bg-transparent outline-none text-center"
                            disabled={isPending}
                        />
                    </div>
                    <button onClick={handlePrevDay} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors" disabled={isPending}>
                        ▶
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            import('xlsx').then(XLSX => {
                                const workbook = XLSX.utils.book_new();
                                const headers = ['שם המורה', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
                                const data: string[][] = [headers];

                                // Use visibleTeacherIds to export exactly what is on screen
                                visibleTeacherIds.forEach(teacherId => {
                                    const teacher = allTeachers.find(t => t.id === teacherId);
                                    if (!teacher) return;

                                    const row = [`${teacher.lastName} ${teacher.firstName}`];

                                    for (let i = 1; i <= 10; i++) {
                                        const schedule = initialSchedules.find(s => s.teacherId === teacherId && s.hourIndex === i);
                                        let cellContent = '';

                                        if (schedule) {
                                            const sub = initialSubstitutions.find(s => s.scheduleId === schedule.id);
                                            if (sub) {
                                                if (sub.status === 'ABSENT') {
                                                    cellContent = 'נעדר';
                                                } else if (sub.substituteTeacherId) {
                                                    const subTeacher = allTeachers.find(t => t.id === sub.substituteTeacherId);
                                                    cellContent = `מוחלף ע"י: ${subTeacher?.lastName || ''}`;
                                                } else {
                                                    cellContent = 'מוחלף';
                                                }
                                            } else {
                                                cellContent = `${schedule.subject || ''} ${schedule.class?.name ? '(' + schedule.class.name + ')' : ''}`;
                                                if (schedule.type === 'STAY') cellContent += ' [שהייה]';
                                                if (schedule.type === 'INDIVIDUAL') cellContent += ' [פרטני]';
                                            }
                                        }
                                        row.push(cellContent);
                                    }
                                    data.push(row);
                                });

                                const worksheet = XLSX.utils.aoa_to_sheet(data);

                                // RTL
                                if (!worksheet['!views']) worksheet['!views'] = [];
                                worksheet['!views'].push({ rightToLeft: true });

                                // Auto-fit Columns
                                const colWidths = headers.map((_, colIndex) => {
                                    let maxLength = 10; // Min width
                                    data.forEach(row => {
                                        const cellValue = row[colIndex] || '';
                                        if (cellValue.length > maxLength) maxLength = cellValue.length;
                                    });
                                    return { wch: maxLength + 2 };
                                });
                                worksheet['!cols'] = colWidths;

                                XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Schedule');
                                XLSX.writeFile(workbook, `daily_substitution_${internalDate}.xlsx`);
                            });
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 font-medium transition-all flex items-center gap-2"
                    >
                        <span>📊 אקסל</span>
                    </button>

                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg shadow-sm hover:bg-gray-900 font-medium transition-all flex items-center gap-2"
                    >
                        <span>🖨️ הדפס / PDF</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div id="daily-grid-container" className="flex-1 overflow-visible bg-white rounded-xl shadow border border-gray-200 pb-32">
                <div className="print-only-header hidden">
                    שיבוץ יומי - {currentDayName} {format(parseISO(internalDate), 'dd/MM/yyyy')}
                </div>
                <table className="min-w-full divide-y divide-gray-200 w-full table-fixed">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-20 w-48 shadow-sm border-l border-gray-200">
                                מורה
                            </th>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                                <th key={i} className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {i}
                                </th>
                            ))}
                            <th className="px-2 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 overflow-visible">
                        {visibleTeacherIds.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="px-6 py-12 text-center text-gray-400">
                                    בחר מורה מהרשימה כדי להתחיל
                                </td>
                            </tr>
                        ) : (
                            visibleTeacherIds.map(teacherId => {
                                const teacher = allTeachers.find(t => t.id === teacherId);
                                if (!teacher) return null;
                                return (
                                    <tr key={teacherId} className="hover:bg-gray-50 transition-colors group/row">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky right-0 bg-white z-10 shadow-sm border-l border-gray-100 group-hover/row:bg-gray-50 text-right">
                                            {teacher.lastName} {teacher.firstName}
                                        </td>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(periodIndex => {
                                            const schedule = initialSchedules.find(s => s.teacherId === teacherId && s.hourIndex === periodIndex);
                                            const sub = initialSubstitutions.find(s => {
                                                if (schedule && s.scheduleId === schedule.id) return true;
                                                if (s.isExtra && s.substituteTeacherId === teacherId) {
                                                    const h = s.schedule ? s.schedule.hourIndex : initialSchedules.find(sch => sch.id === s.scheduleId)?.hourIndex;
                                                    return h === periodIndex;
                                                }
                                                return false;
                                            });

                                            const isSelected = selectedCell?.teacherId === teacherId && selectedCell?.hourIndex === periodIndex;

                                            return (
                                                <td key={periodIndex} className="px-1 py-1 h-20 text-center align-top border-l border-gray-50 last:border-none relative group overflow-visible">

                                                    {(schedule || sub) ? (
                                                        <div
                                                            onClick={() => {
                                                                if (sub && !sub.isExtra) {
                                                                    // If already sub/absent, toggle selection to change sub?
                                                                    setSelectedCell(isSelected ? null : { teacherId, hourIndex: periodIndex });
                                                                } else if (!sub) {
                                                                    // Mark absent
                                                                    if (schedule && (schedule.classId || schedule.subject)) onMarkAbsent(schedule.id);
                                                                }
                                                            }}
                                                            className={`w-full h-full p-1 rounded cursor-pointer flex flex-col justify-between items-center text-xs transition-colors border relative group/menu
                                                                ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-200 z-30' : 'border-transparent hover:bg-gray-100'}
                                                            `}
                                                        >
                                                            {/* Extra Class Hover Btn */}
                                                            {!sub?.isExtra && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); onToggleExtraClass(teacherId, periodIndex, true); }}
                                                                    className="absolute -top-2 -left-2 bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover/menu:opacity-100 shadow-md transition-opacity z-40 text-[10px]"
                                                                    title="הוסף שעה נוספת"
                                                                >
                                                                    +
                                                                </button>
                                                            )}

                                                            {sub ? (
                                                                <div className={`w-full p-1 rounded text-white font-bold text-[10px] flex justify-between items-center group/cancel
                                                                        ${sub.status === 'ABSENT' ? 'bg-red-500' : sub.isExtra ? 'bg-purple-500' : 'bg-green-500'}
                                                                    `}>
                                                                    <span className="truncate">
                                                                        {sub.status === 'ABSENT' ? 'נעדר' : sub.isExtra ? 'שעה נוספת' :
                                                                            (() => {
                                                                                const t = allTeachers.find(at => at.id === sub.substituteTeacherId);
                                                                                return t ? t.lastName : 'מוחלף';
                                                                            })()
                                                                        }
                                                                    </span>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (sub.isExtra) {
                                                                                onToggleExtraClass(teacherId, periodIndex, false);
                                                                            } else if (confirm('האם לבטל השמה זו?')) {
                                                                                onCancel(sub.id);
                                                                            }
                                                                        }}
                                                                        className="opacity-0 group-hover/cancel:opacity-100 hover:text-red-200 transition-opacity ml-1"
                                                                        title="בטל השמה/היעדרות"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="w-full text-right">
                                                                    {/* Hidden button to mark absent */}
                                                                    {schedule && (schedule.classId || schedule.subject) && <span className="text-gray-300 opacity-0 group-hover:opacity-100 text-[10px]">סמן</span>}
                                                                </div>
                                                            )}

                                                            <div className="w-full truncate text-gray-700 font-semibold">{schedule?.subject}</div>
                                                            <div className="w-full truncate text-gray-500">{schedule?.class?.name}</div>

                                                            {schedule && schedule.type !== 'REGULAR' && (
                                                                <div className="text-[9px] bg-yellow-100 text-yellow-800 rounded px-1 mt-auto">
                                                                    {schedule.type === 'STAY' ? 'שהייה' : schedule.type === 'INDIVIDUAL' ? 'פרטני' : 'אחר'}
                                                                </div>
                                                            )}

                                                            {/* Selector Dropdown */}
                                                            {isSelected && sub && !sub.isExtra && (
                                                                <DailySubSelector
                                                                    hourIndex={periodIndex}
                                                                    allTeachers={allTeachers}
                                                                    schedulesAtHour={initialSchedules.filter(s => s.hourIndex === periodIndex)}
                                                                    subsAtHour={initialSubstitutions.filter(s => {
                                                                        const h = s.schedule ? s.schedule.hourIndex : initialSchedules.find(sch => sch.id === s.scheduleId)?.hourIndex;
                                                                        return h === periodIndex;
                                                                    })}
                                                                    onSelect={(subTeacherId) => onAssignSub(sub.id, subTeacherId)}
                                                                    onClose={() => setSelectedCell(null)}
                                                                />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full p-1 rounded hover:bg-gray-100 transition-colors relative group/empty">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onToggleExtraClass(teacherId, periodIndex, true); }}
                                                                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover/empty:opacity-100 shadow-md transition-opacity text-xs"
                                                                title="הוסף שעה נוספת"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="px-2 text-center text-gray-300">
                                            <button
                                                onClick={() => handleRemoveTeacher(teacherId)}
                                                className="hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                                title="הסר"
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
