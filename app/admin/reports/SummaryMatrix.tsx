'use client';

import React from 'react';
import { format, getDate, getDaysInMonth } from 'date-fns';
import * as XLSX from 'xlsx';

interface MatrixData {
    teacherId: string;
    teacherName: string;
    dailyTotals: Record<number, number | string>; // map of day (1-31) to count or "X"
    total?: number; // legacy
    totalDaily?: number;
    totalHourly?: number;
}

interface SummaryMatrixProps {
    title: string;
    monthDate: Date;
    data: MatrixData[];
    useMarks?: boolean; // If true, 0.5 or special value means DAILY absence
    daysCount?: number; // Defaults to full month, can be 1 for daily view
    skipExcel?: boolean;
}

export default function SummaryMatrix({ title, monthDate, data, useMarks = false, daysCount, skipExcel = false }: SummaryMatrixProps) {
    const actualDaysCount = daysCount || getDaysInMonth(monthDate);
    const daysArray = Array.from({ length: actualDaysCount }, (_, i) => daysCount === 1 ? monthDate.getDate() : i + 1);

    const handleDownloadExcel = () => {
        if (skipExcel) return;
        const headers = ['שם המורה', ...daysArray.map(String), 'סה"כ ימים (X)', 'סה"כ שעות'];
        const rows = [headers];

        data.forEach(item => {
            const row = [item.teacherName];
            daysArray.forEach(day => {
                row.push(item.dailyTotals[day]?.toString() || '');
            });
            row.push(item.totalDaily?.toString() || '0');
            row.push(item.totalHourly?.toString() || '0');
            rows.push(row);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        if (!worksheet['!views']) worksheet['!views'] = [];
        worksheet['!views'].push({ rightToLeft: true });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');

        const fileName = `${title.replace(/\s+/g, '_')}_${format(monthDate, 'yyyy_MM')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    if (data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow mt-8 text-center text-gray-500 border border-gray-200">
                לא נמצאו נתונים עבור {title} החודש.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-8 print:shadow-none print:border border-gray-200" dir="rtl">
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                <div className="flex gap-2 print:hidden">
                    <button
                        onClick={handleDownloadExcel}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1 font-medium"
                    >
                        <span>📉</span> אקסל
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900 text-sm flex items-center gap-1 font-medium"
                    >
                        <span>🖨️</span> PDF
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
                <table className="min-w-full divide-y divide-gray-200 border-collapse table-fixed w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 border border-gray-200 sticky right-0 bg-gray-50 z-10 w-48">
                                שם המורה
                            </th>
                            {daysArray.map(day => (
                                <th key={day} className="px-1 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200 w-8">
                                    {day}
                                </th>
                            ))}
                            {/* Only show Days column if data has totalDaily (absence reports) */}
                            {data.some(r => r.totalDaily !== undefined) && (
                                <th className="px-2 py-3 text-center text-[10px] font-bold text-red-700 border border-gray-200 bg-red-50 w-16">
                                    סה"כ ימים (X)
                                </th>
                            )}
                            <th className="px-2 py-3 text-center text-[10px] font-bold text-indigo-700 border border-gray-200 bg-indigo-50 w-16">
                                סה"כ שעות
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row) => (
                            <tr key={row.teacherId} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-2 text-sm font-medium text-gray-900 border border-gray-200 sticky right-0 bg-white z-10 shadow-[inner_-1px_0_0_0_#e5e7eb]">
                                    {row.teacherName}
                                </td>
                                {daysArray.map(day => (
                                    <td key={day} className="px-1 py-2 text-center text-sm text-gray-600 border border-gray-200">
                                        {row.dailyTotals[day] === 'X' ? (
                                            <span className="font-bold text-red-600">X</span>
                                        ) : (
                                            row.dailyTotals[day] !== 0 && row.dailyTotals[day] !== undefined ? row.dailyTotals[day] : ''
                                        )}
                                    </td>
                                ))}
                                {data.some(r => r.totalDaily !== undefined) && (
                                    <td className="px-2 py-2 text-center text-sm font-bold text-red-700 border border-gray-200 bg-red-50/20">
                                        {row.totalDaily ?? 0}
                                    </td>
                                )}
                                <td className="px-2 py-2 text-center text-sm font-bold text-indigo-700 border border-gray-200 bg-indigo-50/20">
                                    {row.totalHourly ?? 0}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
