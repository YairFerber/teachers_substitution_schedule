'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

// Minimal types for client
interface Substitution {
    id: string;
    date: Date | string;
    schedule: {
        hourIndex: number;
        class?: { name: string };
        subject?: string;
    };
    status: string;
}

interface MonthlyReportProps {
    teacherId: string;
}

export default function MonthlySubstitutionReport({ teacherId }: MonthlyReportProps) {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchSubs() {
            setLoading(true);
            try {
                // Fetch subtitutions for this teacher and month
                // We'll need an API route or server action for this. 
                // Let's assume a generic API route for now or create one.
                // Or simplified: fetch all and filter client side if not too many?
                // Better: Server Action.
                // Let's call an API route we will create: /api/substitutions?teacherId=...&month=...
                const res = await fetch(`/api/substitutions?teacherId=${teacherId}&month=${month}`);
                if (res.ok) {
                    const data = await res.json();
                    setSubstitutions(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchSubs();
    }, [teacherId, month]);

    const totalHours = substitutions.length;

    return (
        <div className="animate-fade-in-up mt-8">
            <div className="flex justify-between items-center mb-6">
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="border border-gray-300 rounded p-2"
                />
                <h2 className="text-xl font-semibold text-gray-700 text-right" dir="rtl">
                    דוח מילוי מקום חודשי
                </h2>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200" dir="rtl">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שעה</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">כיתה</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">מקצוע</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
                        ) : substitutions.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-4 text-gray-500">No substitutions found for this month.</td></tr>
                        ) : (
                            substitutions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {format(new Date(sub.date), 'dd/MM/yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {sub.schedule.hourIndex}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {sub.schedule.class?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {sub.schedule.subject || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sub.status === 'COVERED' || sub.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                                sub.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {
                                                sub.status === 'COVERED' ? 'שובץ' :
                                                    sub.status === 'ACCEPTED' ? 'אושר' :
                                                        sub.status === 'ABSENT' ? 'לא שובץ' :
                                                            'ממתין'
                                            }
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold">
                        <tr>
                            <td colSpan={4} className="px-6 py-3 text-right">סה"כ שעות:</td>
                            <td className="px-6 py-3 text-right">{totalHours}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
