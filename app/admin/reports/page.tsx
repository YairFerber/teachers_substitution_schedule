'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, subMonths, addMonths } from 'date-fns';
import { getMonthlySubstitutions } from './actions';
import SummaryMatrix from './SummaryMatrix';

interface SubstitutionReportItem {
    id: string;
    date: Date;
    status: string;
    isExtra?: boolean;
    absenceType?: string;
    substituteTeacherId?: string | null;
    schedule: {
        hourIndex: number;
        subject: string | null;
        class: { name: string } | null;
        teacher: { id: string; firstName: string; lastName: string };
    };
    substituteTeacher?: { id: string; firstName: string; lastName: string } | null;
}

export default function MonthlyReportPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [substitutions, setSubstitutions] = useState<SubstitutionReportItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'teacher' | 'date'>('teacher');
    const [activeTab, setActiveTab] = useState<'DETAILED' | 'EXTRA' | 'ABSENT_SYSTEM' | 'ABSENT_OUT'>('DETAILED');

    useEffect(() => {
        setLoading(true);
        getMonthlySubstitutions(currentMonth)
            .then(data => {
                setSubstitutions(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [currentMonth]);

    // Filter for Detailed view (only actual coverings and extra classes)
    const detailedSubs = substitutions.filter(s => s.status === 'COVERED' || s.isExtra);

    // Group by substitute teacher
    const groupedSubs = detailedSubs.reduce((acc, sub) => {
        const teacherName = sub.substituteTeacher
            ? `${sub.substituteTeacher.firstName} ${sub.substituteTeacher.lastName}`
            : 'Unassigned';

        if (!acc[teacherName]) acc[teacherName] = [];
        acc[teacherName].push(sub);
        return acc;
    }, {} as Record<string, SubstitutionReportItem[]>);

    // Sort by Date
    const sortedByDate = [...detailedSubs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group by Date for visual grouping
    const groupedByDate = detailedSubs.reduce((acc, sub) => {
        const dateKey = format(new Date(sub.date), 'yyyy-MM-dd');
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(sub);
        return acc;
    }, {} as Record<string, SubstitutionReportItem[]>);

    const sortedDateKeys = Object.keys(groupedByDate).sort();

    // Matrix Processing
    const generateMatrixData = (filterFn: (sub: SubstitutionReportItem) => boolean, keyExtractor: (sub: SubstitutionReportItem) => { id: string, name: string }) => {
        const teacherTotals: Record<string, { teacherId: string; teacherName: string; dailyTotals: Record<number, number>; total: number }> = {};

        substitutions.filter(filterFn).forEach(sub => {
            const teacher = keyExtractor(sub);
            if (!teacher || !teacher.id) return;

            if (!teacherTotals[teacher.id]) {
                teacherTotals[teacher.id] = { teacherId: teacher.id, teacherName: teacher.name, dailyTotals: {}, total: 0 };
            }

            const day = new Date(sub.date).getDate();
            teacherTotals[teacher.id].dailyTotals[day] = (teacherTotals[teacher.id].dailyTotals[day] || 0) + 1;
            teacherTotals[teacher.id].total++;
        });

        return Object.values(teacherTotals).sort((a, b) => a.teacherName.localeCompare(b.teacherName));
    };

    const extraData = generateMatrixData(
        sub => Boolean(sub.isExtra && sub.substituteTeacherId),
        sub => ({ id: sub.substituteTeacherId!, name: `${sub.substituteTeacher?.firstName} ${sub.substituteTeacher?.lastName}` })
    );

    const absentSystemData = generateMatrixData(
        sub => sub.status === 'ABSENT' && sub.absenceType !== 'WORK_OUT',
        sub => ({ id: sub.schedule.teacher.id, name: `${sub.schedule.teacher.firstName} ${sub.schedule.teacher.lastName}` })
    );

    const absentOutData = generateMatrixData(
        sub => sub.status === 'ABSENT' && sub.absenceType === 'WORK_OUT',
        sub => ({ id: sub.schedule.teacher.id, name: `${sub.schedule.teacher.firstName} ${sub.schedule.teacher.lastName}` })
    );

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadCSV = () => {
        const headers = ['Substitute Teacher', 'Date', 'Day', 'Hour', 'Class', 'Subject', 'Original Teacher'];
        const csvRows = [headers.join(',')];

        let dataToExport: SubstitutionReportItem[] = [];

        if (sortBy === 'date') {
            dataToExport = sortedByDate;
        } else {
            // Flatten grouped
            Object.values(groupedSubs).forEach(group => dataToExport.push(...group));
        }

        dataToExport.forEach((sub) => {
            const teacherName = sub.substituteTeacher
                ? `${sub.substituteTeacher.firstName} ${sub.substituteTeacher.lastName}`
                : 'Unassigned';
            const date = new Date(sub.date).toLocaleDateString('he-IL');
            const day = format(new Date(sub.date), 'EEEE');
            const hour = sub.schedule.hourIndex;
            const className = sub.schedule.class?.name || '-';
            const subject = sub.schedule.subject || '-';
            const originalTeacher = `${sub.schedule.teacher.firstName} ${sub.schedule.teacher.lastName}`;

            csvRows.push([
                `"${teacherName}"`,
                `"${date}"`,
                `"${day}"`,
                `"${hour}"`,
                `"${className}"`,
                `"${subject}"`,
                `"${originalTeacher}"`
            ].join(','));
        });

        const csvString = '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel Hebrew support
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `substitutions_report_${format(currentMonth, 'yyyy-MM')}_by_${sortBy}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div id="report-container" className="min-h-screen bg-gray-50 p-8 print:bg-white print:p-0">
            <div className="max-w-6xl mx-auto">
                {/* Header (Hidden on Print) */}
                <div className="flex justify-between items-center mb-8 print:hidden">
                    <h1 className="text-3xl font-bold text-gray-800">Monthly Substitution Reports</h1>
                    <div className="flex gap-4">
                        <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium flex items-center gap-2">
                            <span>🖨️</span> Print to PDF
                        </button>
                        <button onClick={handleDownloadCSV} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium flex items-center gap-2">
                            <span>📉</span> Download CSV
                        </button>
                        <a href="/admin/teachers" className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Back</a>
                    </div>
                </div>

                {/* Filters (Hidden on Print) */}
                <div className="bg-white p-4 rounded-lg shadow mb-8 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden" dir="rtl">
                    {/* Sort Toggles */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setSortBy('teacher')}
                            className={`px-4 py-2 rounded-md font-medium transition-colors ${sortBy === 'teacher' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Sort by Teacher
                        </button>
                        <button
                            onClick={() => setSortBy('date')}
                            className={`px-4 py-2 rounded-md font-medium transition-colors ${sortBy === 'date' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Sort by Date
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => setCurrentMonth(prev => subMonths(prev, 1))} className="text-gray-600 hover:text-black font-bold text-xl">&lt;</button>
                        <span className="text-xl font-bold min-w-[200px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
                        <button onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} className="text-gray-600 hover:text-black font-bold text-xl">&gt;</button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6 print:hidden overflow-x-auto" dir="rtl">
                    <button
                        onClick={() => setActiveTab('DETAILED')}
                        className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'DETAILED' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700 bg-gray-50'}`}
                    >
                        דוח שינויים מפורט
                    </button>
                    <button
                        onClick={() => setActiveTab('EXTRA')}
                        className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'EXTRA' ? 'border-b-2 border-purple-600 text-purple-600 bg-white' : 'text-gray-500 hover:text-gray-700 bg-gray-50'}`}
                    >
                        שעות נוספות
                    </button>
                    <button
                        onClick={() => setActiveTab('ABSENT_SYSTEM')}
                        className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'ABSENT_SYSTEM' ? 'border-b-2 border-red-600 text-red-600 bg-white' : 'text-gray-500 hover:text-gray-700 bg-gray-50'}`}
                    >
                        היעדרויות (מחלה/חופש)
                    </button>
                    <button
                        onClick={() => setActiveTab('ABSENT_OUT')}
                        className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'ABSENT_OUT' ? 'border-b-2 border-orange-600 text-orange-600 bg-white' : 'text-gray-500 hover:text-gray-700 bg-gray-50'}`}
                    >
                        עבודה מחוץ לביה"ס
                    </button>
                </div>

                {/* Printable Report Title */}
                <div className="hidden print:block text-center mb-8 mt-8">
                    <h1 className="text-2xl font-bold" dir="rtl">
                        דוח שינויים והחלפות - {format(currentMonth, 'MMMM yyyy')}
                        <span className="text-sm font-normal block mt-1 text-gray-500">
                            (Sorted by {sortBy === 'teacher' ? 'Substitute Teacher' : 'Date'})
                        </span>
                    </h1>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading report...</div>
                ) : (
                    <>
                        {activeTab === 'DETAILED' && (
                            <div className="space-y-8" dir="rtl">
                                {detailedSubs.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500 bg-white rounded shadow">לא נמצאו כיסויים או שעות נוספות לחודש זה.</div>
                                ) : sortBy === 'teacher' ? (
                                    // Grouped View
                                    Object.entries(groupedSubs).map(([teacherName, subs]) => (
                                        <div key={teacherName} className="bg-white rounded-lg shadow overflow-hidden print:shadow-none print:border border-gray-200 mb-8 break-inside-avoid">
                                            <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                                                <h2 className="text-lg font-bold text-gray-800">{teacherName}</h2>
                                                <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                    {subs.length} substitutions
                                                </span>
                                            </div>
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך</th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שעה</th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פרטים</th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">במקום</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {subs.map((sub) => (
                                                        <tr key={sub.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {new Date(sub.date).toLocaleDateString('he-IL')}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {sub.schedule.hourIndex}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {sub.schedule.subject} ({sub.schedule.class?.name})
                                                                {sub.isExtra && <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 rounded-full">שעה נוספת</span>}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {sub.schedule.teacher.firstName} {sub.schedule.teacher.lastName}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))
                                ) : (
                                    // Date View (Grouped by Date)
                                    sortedDateKeys.map((dateKey) => {
                                        const subs = groupedByDate[dateKey];
                                        const displayDate = new Date(dateKey).toLocaleDateString('he-IL');
                                        return (
                                            <div key={dateKey} className="bg-white rounded-lg shadow overflow-hidden print:shadow-none print:border border-gray-200 mb-8 break-inside-avoid">
                                                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                                                    <h2 className="text-lg font-bold text-gray-800">{displayDate}</h2>
                                                    <span className="text-sm font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                                        {subs.length} items
                                                    </span>
                                                </div>
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">מחליף/ה</th>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שעה</th>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פרטים</th>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">במקום</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {subs.sort((a, b) => a.schedule.hourIndex - b.schedule.hourIndex).map((sub) => (
                                                            <tr key={sub.id}>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                                                    {sub.substituteTeacher ? `${sub.substituteTeacher.firstName} ${sub.substituteTeacher.lastName}` : 'Unassigned'}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {sub.schedule.hourIndex}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {sub.schedule.subject} ({sub.schedule.class?.name})
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {sub.schedule.teacher.firstName} {sub.schedule.teacher.lastName}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {activeTab === 'EXTRA' && (
                            <SummaryMatrix title="שעות נוספות החודש" monthDate={currentMonth} data={extraData} />
                        )}

                        {activeTab === 'ABSENT_SYSTEM' && (
                            <SummaryMatrix title="דו״ח היעדרויות לחשבות (מחלה/חופש)" monthDate={currentMonth} data={absentSystemData} />
                        )}

                        {activeTab === 'ABSENT_OUT' && (
                            <SummaryMatrix title="עבודה מחוץ לביה״ס (אין לדווח לחשבות)" monthDate={currentMonth} data={absentOutData} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
