'use client';

import { useState, useEffect } from 'react';
import { format, subMonths, addMonths, subDays, addDays } from 'date-fns';
import { getMonthlySubstitutions } from './actions';
import SummaryMatrix from './SummaryMatrix';

interface SubstitutionReportItem {
    id: string;
    date: Date;
    status: string;
    isExtra?: boolean;
    absenceType?: string | null;
    substituteTeacherId?: string | null;
    notes?: string | null;
    schedule: {
        hourIndex: number;
        subject: string | null;
        class: { name: string } | null;
        teacher: { id: string; firstName: string; lastName: string };
    };
    substituteTeacher?: { id: string; firstName: string; lastName: string } | null;
}

type TabType = 'ABSENT_DAILY' | 'ABSENT_MONTHLY' | 'SUB_DAILY' | 'SUB_MONTHLY';

const absenceTypeLabel = (type?: string | null) => {
    if (type === 'SICK') return '🤒 מחלה';
    if (type === 'VACATION') return '🌴 חופש';
    if (type === 'WORK_OUT') return '🛡️ בתפקיד';
    return type || '';
};

export default function MonthlyReportPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [substitutions, setSubstitutions] = useState<SubstitutionReportItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('ABSENT_DAILY');

    const isDailyTab = activeTab === 'ABSENT_DAILY' || activeTab === 'SUB_DAILY';

    useEffect(() => {
        setLoading(true);
        getMonthlySubstitutions(currentDate)
            .then(data => {
                setSubstitutions(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [currentDate]);

    // ─── Daily Absence Data ───────────────────────────────────────────
    // Filter to selected date only
    const selectedDateStr = format(currentDate, 'yyyy-MM-dd');

    // Aggregate: one row per teacher for the selected day
    const buildDailyAbsenceSummary = (filterType: 'sick' | 'duty') => {
        const byTeacher: Record<string, {
            teacherId: string;
            teacherName: string;
            isDaily: boolean;
            hourCount: number;
            absenceType: string;
        }> = {};

        substitutions
            .filter(s => {
                const d = format(new Date(s.date), 'yyyy-MM-dd');
                if (d !== selectedDateStr) return false;
                if (!s.absenceType) return false;
                return filterType === 'sick' ? s.absenceType !== 'WORK_OUT' : s.absenceType === 'WORK_OUT';
            })
            .forEach(s => {
                const tid = s.schedule.teacher.id;
                if (!byTeacher[tid]) {
                    byTeacher[tid] = {
                        teacherId: tid,
                        teacherName: `${s.schedule.teacher.firstName} ${s.schedule.teacher.lastName}`,
                        isDaily: false,
                        hourCount: 0,
                        absenceType: s.absenceType || '',
                    };
                }
                if ((s as any).absenceScope === 'DAILY') {
                    byTeacher[tid].isDaily = true;
                } else {
                    byTeacher[tid].hourCount++;
                }
            });

        return Object.values(byTeacher).sort((a, b) => a.teacherName.localeCompare(b.teacherName));
    };

    const dailySickSummary = buildDailyAbsenceSummary('sick');
    const dailyDutySummary = buildDailyAbsenceSummary('duty');

    // ─── Daily Substitution Data ──────────────────────────────────────
    // One row per substitute teacher, showing total hours they substituted today
    const buildDailySubSummary = () => {
        const byTeacher: Record<string, { teacherId: string; teacherName: string; hours: number }> = {};

        substitutions
            .filter(s => {
                const d = format(new Date(s.date), 'yyyy-MM-dd');
                return d === selectedDateStr && s.substituteTeacherId && s.status === 'COVERED';
            })
            .forEach(s => {
                const tid = s.substituteTeacherId!;
                const name = s.substituteTeacher
                    ? `${s.substituteTeacher.firstName} ${s.substituteTeacher.lastName}`
                    : 'לא ידוע';
                if (!byTeacher[tid]) byTeacher[tid] = { teacherId: tid, teacherName: name, hours: 0 };
                byTeacher[tid].hours++;
            });

        return Object.values(byTeacher).sort((a, b) => a.teacherName.localeCompare(b.teacherName));
    };

    const dailySubSummary = buildDailySubSummary();

    // ─── Monthly Matrix Processing ────────────────────────────────────
    const generateMatrixData = (
        filterFn: (sub: SubstitutionReportItem) => boolean,
        keyExtractor: (sub: SubstitutionReportItem) => { id: string, name: string },
        showXForDaily: boolean = true
    ) => {
        const teacherTotals: Record<string, {
            teacherId: string;
            teacherName: string;
            dailyTotals: Record<number, number | string>;
            totalDaily: number;
            totalHourly: number;
        }> = {};

        substitutions.filter(filterFn).forEach(sub => {
            const teacher = keyExtractor(sub);
            if (!teacher || !teacher.id) return;

            if (!teacherTotals[teacher.id]) {
                teacherTotals[teacher.id] = {
                    teacherId: teacher.id,
                    teacherName: teacher.name,
                    dailyTotals: {},
                    totalDaily: 0,
                    totalHourly: 0
                };
            }

            const day = new Date(sub.date).getDate();

            if (showXForDaily && (sub as any).absenceScope === 'DAILY') {
                if (teacherTotals[teacher.id].dailyTotals[day] !== 'X') {
                    if (typeof teacherTotals[teacher.id].dailyTotals[day] === 'number') {
                        teacherTotals[teacher.id].totalHourly -= (teacherTotals[teacher.id].dailyTotals[day] as number);
                    }
                    teacherTotals[teacher.id].dailyTotals[day] = 'X';
                    teacherTotals[teacher.id].totalDaily++;
                }
            } else {
                if (teacherTotals[teacher.id].dailyTotals[day] !== 'X') {
                    teacherTotals[teacher.id].dailyTotals[day] = ((teacherTotals[teacher.id].dailyTotals[day] as number) || 0) + 1;
                    teacherTotals[teacher.id].totalHourly++;
                }
            }
        });

        return Object.values(teacherTotals).sort((a, b) => a.teacherName.localeCompare(b.teacherName));
    };

    // Monthly Absence matrices
    const absentSystemData = generateMatrixData(
        sub => Boolean(sub.absenceType && sub.absenceType !== 'WORK_OUT'),
        sub => ({ id: sub.schedule.teacher.id, name: `${sub.schedule.teacher.firstName} ${sub.schedule.teacher.lastName}` }),
        true
    );

    const absentOutData = generateMatrixData(
        sub => sub.absenceType === 'WORK_OUT',
        sub => ({ id: sub.schedule.teacher.id, name: `${sub.schedule.teacher.firstName} ${sub.schedule.teacher.lastName}` }),
        true
    );

    // Monthly Sub matrix — substitutions are ALWAYS hourly (no DAILY scope), summary = total hours
    const subData = generateMatrixData(
        sub => Boolean(sub.substituteTeacherId && sub.status === 'COVERED'),
        sub => ({ id: sub.substituteTeacherId!, name: `${sub.substituteTeacher?.firstName} ${sub.substituteTeacher?.lastName}` }),
        false // Never X for substitutions
    );
    // Hide totalDaily (0 always), keep totalHourly as total hours
    const monthlySubData = subData.map(d => ({ ...d, totalDaily: undefined }));

    const handlePrint = () => window.print();

    // ─── Simple Daily Table Component ──────────────────────────────────
    const AbsenceDailyTable = ({
        rows, title, color
    }: {
        rows: { teacherId: string; teacherName: string; isDaily: boolean; hourCount: number; absenceType: string }[];
        title: string;
        color: string;
    }) => (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200" dir="rtl">
            <div className={`px-6 py-4 border-b border-gray-100 flex justify-between items-center ${color}`}>
                <h2 className="text-base font-bold">{title}</h2>
                <span className="text-xs font-semibold bg-white/70 px-3 py-1 rounded-full">{rows.length} מורות</span>
            </div>
            {rows.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">אין היעדרויות ביום זה</div>
            ) : (
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/80">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase w-1/2">שם המורה</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-1/4">היקף</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">סוג</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {rows.map(row => (
                            <tr key={row.teacherId} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3 text-sm font-medium text-gray-800">{row.teacherName}</td>
                                <td className="px-6 py-3 text-center">
                                    {row.isDaily ? (
                                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                                            <span className="text-base leading-none">X</span> יומי
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                                            {row.hourCount} {row.hourCount === 1 ? 'שעה' : 'שעות'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-600">{absenceTypeLabel(row.absenceType)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );

    // ─── Simple Daily Sub Table ─────────────────────────────────────────
    const SubDailyTable = ({
        rows
    }: {
        rows: { teacherId: string; teacherName: string; hours: number }[];
    }) => (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200" dir="rtl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-green-50 text-green-800">
                <h2 className="text-base font-bold">מילוי מקום — {format(currentDate, 'dd/MM/yyyy')}</h2>
                <span className="text-xs font-semibold bg-white/70 px-3 py-1 rounded-full">{rows.length} ממלאי מקום</span>
            </div>
            {rows.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">אין מילוי מקום ביום זה</div>
            ) : (
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/80">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase w-2/3">שם המורה</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">שעות מ"מ</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {rows.map(row => (
                            <tr key={row.teacherId} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3 text-sm font-medium text-gray-800">{row.teacherName}</td>
                                <td className="px-6 py-3 text-center">
                                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                        {row.hours} {row.hours === 1 ? 'שעה' : 'שעות'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );

    return (
        <div id="report-container" className="min-h-screen bg-gray-50 p-8 print:bg-white print:p-0">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 print:hidden">
                    <h1 className="text-3xl font-bold text-gray-800">דוחות נוכחות ומילוי מקום</h1>
                    <div className="flex gap-3">
                        <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-sm">
                            🖨️ הדפסה / PDF
                        </button>
                        <a href="/admin/teachers" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">← חזרה</a>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b-2 border-gray-200 mb-6 print:hidden overflow-x-auto gap-1" dir="rtl">
                    {([
                        { key: 'ABSENT_DAILY', label: 'היעדרויות יומי', color: 'red' },
                        { key: 'ABSENT_MONTHLY', label: 'היעדרויות חודשי', color: 'red' },
                        { key: 'SUB_DAILY', label: 'מ"מ יומי', color: 'green' },
                        { key: 'SUB_MONTHLY', label: 'מ"מ חודשי', color: 'purple' },
                    ] as const).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-5 py-3 font-semibold text-sm transition-all whitespace-nowrap rounded-t-lg border-b-2 -mb-0.5 ${activeTab === tab.key
                                    ? tab.color === 'red' ? 'border-red-500 text-red-700 bg-red-50'
                                        : tab.color === 'green' ? 'border-green-500 text-green-700 bg-green-50'
                                            : 'border-purple-500 text-purple-700 bg-purple-50'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Date / Month Navigator */}
                <div className="bg-white rounded-xl shadow-sm px-6 py-4 mb-6 flex items-center justify-between print:hidden border border-gray-200">
                    <button
                        onClick={() => setCurrentDate(prev => isDailyTab ? subDays(prev, 1) : subMonths(prev, 1))}
                        className="text-gray-600 hover:text-black font-bold text-xl w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
                    >
                        &lt;
                    </button>
                    <div className="text-center">
                        <div className="text-xl font-bold text-gray-800">
                            {isDailyTab ? format(currentDate, 'dd/MM/yyyy') : format(currentDate, 'MMMM yyyy')}
                        </div>
                        {isDailyTab && (
                            <div className="text-sm text-gray-500 mt-0.5">
                                {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][currentDate.getDay()]}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setCurrentDate(prev => isDailyTab ? addDays(prev, 1) : addMonths(prev, 1))}
                        className="text-gray-600 hover:text-black font-bold text-xl w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
                    >
                        &gt;
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-16 text-gray-400">
                        <div className="text-4xl mb-4">⏳</div>
                        <div className="text-lg">טוען נתונים...</div>
                    </div>
                ) : (
                    <>
                        {/* ── TAB 1: ABSENCE DAILY ── */}
                        {activeTab === 'ABSENT_DAILY' && (
                            <div className="space-y-4">
                                <AbsenceDailyTable
                                    rows={dailySickSummary}
                                    title="היעדרויות — מחלה / חופש"
                                    color="bg-red-50 text-red-800"
                                />
                                <AbsenceDailyTable
                                    rows={dailyDutySummary}
                                    title="היעדרויות — בתפקיד"
                                    color="bg-orange-50 text-orange-800"
                                />
                            </div>
                        )}

                        {/* ── TAB 2: ABSENCE MONTHLY ── */}
                        {activeTab === 'ABSENT_MONTHLY' && (
                            <div className="space-y-8">
                                <SummaryMatrix
                                    title="היעדרויות חודשיות — מחלה / חופש"
                                    monthDate={currentDate}
                                    data={absentSystemData}
                                />
                                <SummaryMatrix
                                    title="היעדרויות חודשיות — בתפקיד"
                                    monthDate={currentDate}
                                    data={absentOutData}
                                />
                            </div>
                        )}

                        {/* ── TAB 3: SUB DAILY ── */}
                        {activeTab === 'SUB_DAILY' && (
                            <SubDailyTable rows={dailySubSummary} />
                        )}

                        {/* ── TAB 4: SUB MONTHLY ── */}
                        {activeTab === 'SUB_MONTHLY' && (
                            <SummaryMatrix
                                title="מילוי מקום חודשי — שעות"
                                monthDate={currentDate}
                                data={monthlySubData}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
