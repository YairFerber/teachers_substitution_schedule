'use client';

import { useState, useRef, useEffect } from 'react';

interface Teacher {
    id: string;
    firstName: string;
    lastName: string;
    type: string;
}

interface Schedule {
    teacherId: string;
    hourIndex: number;
    type: string; // REGULAR, STAY, INDIVIDUAL, MEETING
}

interface Substitution {
    substituteTeacherId: string | null;
    schedule?: { hourIndex: number };
}

interface DailySubSelectorProps {
    hourIndex: number;
    allTeachers: Teacher[];
    schedulesAtHour: Schedule[]; // Schedules for this specific hour
    subsAtHour: Substitution[];   // Substitutions occurring at this hour
    onSelect: (teacherId: string) => void;
    onClose: () => void;
}

export default function DailySubSelector({ hourIndex, allTeachers, schedulesAtHour, subsAtHour, onSelect, onClose }: DailySubSelectorProps) {
    const [search, setSearch] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    // Filter available teachers
    const filteredTeachers = allTeachers.filter(t =>
        t.firstName.toLowerCase().includes(search.toLowerCase()) ||
        t.lastName.toLowerCase().includes(search.toLowerCase())
    );

    // Categorize
    const processed = filteredTeachers.map(t => {
        // 1. Check if covering someone else
        const isSubbing = subsAtHour.some(s => s.substituteTeacherId === t.id);
        if (isSubbing) return { teacher: t, status: 'BUSY_SUB', label: 'ממלא מקום' };

        // 2. Check their own schedule
        const sched = schedulesAtHour.find(s => s.teacherId === t.id);

        if (!sched) {
            return { teacher: t, status: 'FREE', label: 'פנוי' };
        }

        switch (sched.type) {
            case 'STAY': return { teacher: t, status: 'STAY', label: 'שהייה' };
            case 'INDIVIDUAL': return { teacher: t, status: 'INDIVIDUAL', label: 'פרטני' };
            case 'MEETING': return { teacher: t, status: 'MEETING', label: 'ישיבה' }; // treat as busy?
            default: return { teacher: t, status: 'BUSY_CLASS', label: 'בשיעור' }; // REGULAR
        }
    });

    // Valid Candidates: Free, Stay, Individual
    // Hidden: Busy Sub, Busy Class, Meeting (maybe?)
    // User asked to see: Free, In School (Stay), Private (Individual)

    const candidates = processed.filter(p =>
        ['FREE', 'STAY', 'INDIVIDUAL'].includes(p.status)
    );

    // Sort:
    // 1. Valid Substitute Teachers (Type=SUBSTITUTE) who are FREE first?
    // 2. Then regular Free
    // 3. Then Stay/Individual

    candidates.sort((a, b) => {
        // Priority 1: Official Substitutes who are Free
        const aIsSub = a.teacher.type === 'SUBSTITUTE';
        const bIsSub = b.teacher.type === 'SUBSTITUTE';
        if (aIsSub && !bIsSub) return -1;
        if (!aIsSub && bIsSub) return 1;

        // Priority 2: Status (Free > Stay > Individual)
        const score = (s: string) => {
            if (s === 'FREE') return 0;
            if (s === 'STAY') return 1;
            if (s === 'INDIVIDUAL') return 2;
            return 9;
        };
        return score(a.status) - score(b.status);
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
                        }

                        // Special highlight for Official Substitutes
                        const isOfficialSub = teacher.type === 'SUBSTITUTE';

                        return (
                            <button
                                key={teacher.id}
                                onClick={() => onSelect(teacher.id)}
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
