'use client';

import React from 'react';
import { ScheduleItem, Period } from '../types';

interface ScheduleGridProps {
    schedule: ScheduleItem[];
    periods: Period[];
    loading?: boolean;
    onPeriodClick?: (dayIndex: number, hourIndex: number, item?: ScheduleItem) => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Helper to get color based on schedule type
const getTypeColor = (type: string, hasClass: boolean) => {
    if (type === 'FREE' && !hasClass) return 'bg-gray-50 border-gray-100 text-gray-400';
    if (type === 'ABSENT_DISPLAY') return 'bg-red-100 border-red-300 text-red-800 border-2 border-dashed';
    if (type === 'COVERED_ABSENCE_DISPLAY') return 'bg-[repeating-linear-gradient(45deg,#dcfce7,#dcfce7_10px,#fee2e2_10px,#fee2e2_20px)] border-green-500 text-green-900 border-l-4 shadow-sm'; // Striped Green/Red
    if (type === 'COVERED_DISPLAY') return 'bg-green-100 border-green-500 text-green-900 border-l-4 shadow-sm';
    if (type === 'STAY') return 'bg-blue-50 border-blue-200 text-blue-700'; // Shahiya
    if (type === 'INDIVIDUAL') return 'bg-purple-50 border-purple-200 text-purple-700'; // Partani
    if (type === 'MEETING' || type === 'TEAM_MEETING') return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    return 'bg-white border-gray-200 text-gray-900'; // Regular
};

const getHebrewDayName = (dayIndex: number) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
    return days[dayIndex] || '';
};

export default function ScheduleGrid({ schedule, periods, loading = false, onPeriodClick }: ScheduleGridProps) {
    // Create a fast lookup map for schedule items: `${day}-${hour}`
    const scheduleMap = React.useMemo(() => {
        const map = new Map<string, ScheduleItem>();
        schedule.forEach((item) => {
            map.set(`${item.dayOfWeek}-${item.hourIndex}`, item);
        });
        return map;
    }, [schedule]);

    // Use periods or fallback to 1-10 if fetch fails or loading
    const timeSlots = periods.length > 0 ? periods : Array.from({ length: 10 }, (_, i) => ({ index: i + 1, startTime: '', endTime: '' }));

    if (loading) {
        return (
            <div className="w-full h-96 flex items-center justify-center text-gray-500 animate-pulse">
                Loading schedule...
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white" dir="rtl">
            <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="grid grid-cols-[100px_repeat(6,1fr)] bg-gray-100 border-b border-gray-200">
                    <div className="p-3 text-center font-bold text-gray-600 border-l border-gray-200">שעה</div>
                    {DAYS.map((_, index) => (
                        <div key={index} className="p-3 text-center font-bold text-gray-700 border-l border-gray-200 last:border-l-0">
                            {getHebrewDayName(index)}
                        </div>
                    ))}
                </div>

                {/* Schedule Rows */}
                {timeSlots.map((period) => (
                    <div key={period.index} className="grid grid-cols-[100px_repeat(6,1fr)] border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                        {/* Hour Label with Time Range */}
                        <div className="p-2 flex flex-col items-center justify-center font-medium text-gray-500 border-l border-gray-200 bg-gray-50/50">
                            <span className="text-lg font-bold">{period.index}</span>
                            {period.startTime && period.endTime && (
                                <span className="text-xs text-gray-400 mt-1">{period.startTime}-{period.endTime}</span>
                            )}
                        </div>

                        {/* Day Columns for this Hour */}
                        {DAYS.map((_, dayIndex) => {
                            const item = scheduleMap.get(`${dayIndex}-${period.index}`);
                            const hasClass = !!item?.class;
                            const type = item?.type || 'FREE';

                            const isEmpty = !item;

                            return (
                                <div
                                    key={`${dayIndex}-${period.index}`}
                                    onClick={() => onPeriodClick && onPeriodClick(dayIndex, period.index, item)}
                                    className={`p-2 min-h-[100px] border-l border-gray-100 last:border-l-0 flex flex-col justify-center items-center text-center relative group ${onPeriodClick ? 'cursor-pointer hover:bg-blue-50/30' : ''}`}
                                >
                                    {isEmpty ? (
                                        <div className="w-full h-full rounded bg-gray-50/30"></div>
                                    ) : (
                                        <div className={`w-full h-full rounded p-2 flex flex-col items-center justify-center gap-1 border shadow-sm transition-all hover:shadow-md ${getTypeColor(type, hasClass)}`}>
                                            {item.subject && (
                                                <span className="font-bold text-sm leading-tight text-center">{item.subject}</span>
                                            )}
                                            {hasClass && (
                                                <span className="text-xs font-semibold leading-tight text-center">{item.class?.name}</span>
                                            )}
                                            <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">
                                                {type === 'REGULAR' && hasClass ? 'שיעור' :
                                                    type === 'STAY' ? 'שהייה' :
                                                        type === 'INDIVIDUAL' ? 'פרטני' :
                                                            type === 'MEETING' ? 'ישיבה' :
                                                                type === 'COVERED_ABSENCE_DISPLAY' ? 'ממלא מקום' : type}
                                            </span>

                                            {/* Indicate Substitution if any */}
                                            {item.substitutions && item.substitutions.length > 0 && !['ABSENT_DISPLAY', 'COVERED_ABSENCE_DISPLAY', 'COVERED_DISPLAY'].includes(type) && (
                                                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Substitution exists"></div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
