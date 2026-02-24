'use client';

import { useState, useRef, useEffect } from 'react';

interface Teacher {
    id: string;
    firstName: string;
    lastName: string;
    type: string;
}

interface Schedule {
    id: string;
    teacherId: string;
    hourIndex: number;
    type: string; // REGULAR, STAY, INDIVIDUAL, MEETING
}

interface Substitution {
    id: string;
    substituteTeacherId: string | null;
    status: string;
    absenceScope?: string | null;
    scheduleId: string;
    schedule?: {
        hourIndex: number;
        teacherId: string;
    } | null;
}

interface DailySubSelectorProps {
    hourIndex: number;
    allTeachers: Teacher[];
    schedulesAtHour: Schedule[]; // Schedules for this specific hour
    subsAtHour: Substitution[];   // Substitutions occurring at this hour
    allSubsToday?: Substitution[]; // Substitutions for the entire day (for DAILY checking)
    onSelect: (teacherId: string, isPaid: boolean) => void;
    onClose: () => void;
}

export default function DailySubSelector({ hourIndex, allTeachers, schedulesAtHour, subsAtHour, allSubsToday = [], onSelect, onClose }: DailySubSelectorProps) {
    const [search, setSearch] = useState('');
    const [notForPay, setNotForPay] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Filter available teachers
    const filteredTeachers = allTeachers.filter(t =>
        t.firstName.toLowerCase().includes(search.toLowerCase()) ||
        t.lastName.toLowerCase().includes(search.toLowerCase())
    );

    // Categorize
    const processed = filteredTeachers.map(t => {
        // 1. Check if they are ABSENT for the WHOLE DAY or at this specific hour
        const isAbsentDaily = allSubsToday.some(s =>
            s.absenceScope === 'DAILY' &&
            (s.schedule?.teacherId === t.id || (!s.schedule && schedulesAtHour.find(sch => sch.id === s.scheduleId)?.teacherId === t.id))
        );

        const isAbsentHourly = subsAtHour.some(s =>
            s.status === 'ABSENT' &&
            (s.schedule?.teacherId === t.id || (!s.schedule && schedulesAtHour.find(sch => sch.id === s.scheduleId)?.teacherId === t.id))
        );

        if (isAbsentDaily || isAbsentHourly) return { teacher: t, status: 'ABSENT', label: 'נעדר' };

        // 2. Check if already covering someone else
        const isSubbing = subsAtHour.some(s => s.substituteTeacherId === t.id);
        if (isSubbing) return { teacher: t, status: 'BUSY_SUB', label: 'ממלא מקום' };

        // 3. Check their own schedule
        const sched = schedulesAtHour.find(s => s.teacherId === t.id);

        if (!sched) {
            return { teacher: t, status: 'FREE', label: 'פנוי' };
        }

        switch (sched.type) {
            case 'STAY': return { teacher: t, status: 'STAY', label: 'שהייה' };
            case 'INDIVIDUAL': return { teacher: t, status: 'INDIVIDUAL', label: 'פרטני' };
            case 'MEETING': return { teacher: t, status: 'MEETING', label: 'ישיבה' };
            default: return { teacher: t, status: 'BUSY_CLASS', label: 'בשיעור' };
        }
    });

    // Valid Candidates: Free, Stay, Individual, Busy Class, Absent (moved to bottom)
    const candidates = processed.filter(p =>
        ['FREE', 'STAY', 'INDIVIDUAL', 'BUSY_CLASS', 'ABSENT'].includes(p.status)
    );

    // Sort:
    // 1. STAY (שהייה)
    // 2. INDIVIDUAL (פרטני)
    // 3. Official Substitutes who are FREE (מ"מ)
    // 4. Regular FREE (פנוי)
    // 5. BUSY_CLASS (בשיעור)

    candidates.sort((a, b) => {
        const score = (p: typeof candidates[0]) => {
            if (p.status === 'STAY') return 1;
            if (p.status === 'INDIVIDUAL') return 2;
            if (p.status === 'FREE' && p.teacher.type === 'SUBSTITUTE') return 3;
            if (p.status === 'FREE') return 4;
            if (p.status === 'BUSY_CLASS') return 5;
            if (p.status === 'ABSENT') return 10; // Lowest priority
            return 9;
        };
        return score(a) - score(b);
    });

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div className="absolute z-50 top-full right-0 mt-1 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col text-right animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5" ref={menuRef}>
            <div className="p-2 border-b border-gray-100 bg-gray-50">
                <input
                    type="text"
                    placeholder="חפש מחליף..."
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-indigo-500 text-right"
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="overflow-y-auto max-h-80 p-1 space-y-1">
                {/* Not-for-Pay Checkbox */}
                <label className="flex items-center gap-2 px-2 py-2 mb-1 rounded-lg cursor-pointer select-none"
                    style={{ colorScheme: 'light', color: '#111827' }}
                >
                    <input
                        type="checkbox"
                        checked={notForPay}
                        onChange={e => setNotForPay(e.target.checked)}
                        className="w-4 h-4 accent-orange-500"
                    />
                    <span className="text-sm font-semibold text-orange-700">
                        🟠 לא לתשלום (ללא שכר)
                    </span>
                </label>
                <div className="border-t border-gray-100 pt-1" />

                {candidates.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-xs">אין מורים פנויים</div>
                ) : (
                    candidates.map(({ teacher, status, label }) => {
                        let bgClass = 'hover:bg-gray-50';
                        let badgeClass = 'bg-gray-100 text-gray-600';

                        // Color Coding
                        if (status === 'FREE') {
                            bgClass = 'hover:bg-emerald-50';
                            badgeClass = 'bg-emerald-100 text-emerald-700'; // Green
                        } else if (status === 'STAY') {
                            bgClass = 'hover:bg-amber-50';
                            badgeClass = 'bg-amber-100 text-amber-700'; // Yellow/Orange
                        } else if (status === 'INDIVIDUAL') {
                            bgClass = 'hover:bg-purple-50';
                            badgeClass = 'bg-purple-100 text-purple-700'; // Purple
                        } else if (status === 'BUSY_CLASS') {
                            bgClass = 'hover:bg-rose-50 opacity-70';
                            badgeClass = 'bg-rose-100 text-rose-700'; // Red
                        } else if (status === 'ABSENT') {
                            bgClass = 'hover:bg-red-50 opacity-50';
                            badgeClass = 'bg-red-500 text-white animate-pulse'; // Bright red pulse
                        }

                        // Special highlight for Official Substitutes
                        const isOfficialSub = teacher.type === 'SUBSTITUTE';

                        return (
                            <button
                                key={teacher.id}
                                onClick={() => onSelect(teacher.id, !notForPay)}
                                className={`w-full text-right px-3 py-2 text-sm rounded transition-colors flex justify-between items-center group ${bgClass}`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`font-medium ${isOfficialSub ? 'text-indigo-700' : 'text-gray-700'}`}>
                                        {teacher.lastName} {teacher.firstName}
                                    </span>
                                    {isOfficialSub && (
                                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1 rounded border border-indigo-200">מ"מ</span>
                                    )}
                                </div>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badgeClass}`}>
                                    {label}
                                </span>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
