'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { findAvailableTeachers, markAbsence, assignSubstitute, cancelAbsence, toggleExtraClass } from './substitution-actions';

interface AbsenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    slotInfo: {
        teacherId?: string;
        scheduleId?: string;
        date: Date;
        hourIndex: number;
        dayName: string;
        hourTime: string;
        currentStatus?: string; // ABSENT, COVERED, or undefined (Normal)
        substituteName?: string;
        substitutionId?: string;
        isExtra?: boolean;
        absenceType?: string;
    };
    onSuccess: () => void;
}

export default function AbsenceModal({ isOpen, onClose, slotInfo, onSuccess }: AbsenceModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<'VIEW' | 'ASSIGN'>('VIEW');
    const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [absenceType, setAbsenceType] = useState('SICK');
    const [extraNotes, setExtraNotes] = useState('');

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setStep('VIEW');
            setAvailableTeachers([]);
            setSelectedTeacher('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleMarkAbsence = async () => {
        if (!slotInfo.scheduleId) return;
        if (!confirm('Mark teacher as ABSENT for this class?')) return;
        setLoading(true);
        try {
            await markAbsence(slotInfo.scheduleId, slotInfo.date, absenceType);
            onSuccess();
            router.refresh();
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to mark absence');
        } finally {
            setLoading(false);
        }
    };

    const handleAddExtraClass = async () => {
        if (!slotInfo.teacherId) return;
        setLoading(true);
        try {
            await toggleExtraClass(slotInfo.teacherId, slotInfo.date, slotInfo.hourIndex, true, extraNotes);
            onSuccess();
            router.refresh();
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to add extra class');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveExtraClass = async () => {
        if (!slotInfo.teacherId) return;
        setLoading(true);
        try {
            await toggleExtraClass(slotInfo.teacherId, slotInfo.date, slotInfo.hourIndex, false, '');
            onSuccess();
            router.refresh();
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to remove extra class');
        } finally {
            setLoading(false);
        }
    };

    const handleFetchTeachers = async () => {
        setLoading(true);
        try {
            const teachers = await findAvailableTeachers(slotInfo.date, slotInfo.hourIndex);
            setAvailableTeachers(teachers);
            setStep('ASSIGN');
        } catch (e) {
            console.error(e);
            alert('Failed to find teachers');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedTeacher || !slotInfo.substitutionId) return; // Must have substitution record first (Absence)
        setLoading(true);
        try {
            await assignSubstitute(slotInfo.substitutionId, selectedTeacher);
            onSuccess();
            router.refresh();
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to assign substitute');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAbsence = async () => {
        if (!slotInfo.substitutionId) return;
        if (!confirm('Cancel this absence/substitution? The schedule will revert to normal.')) return;

        setLoading(true);
        try {
            await cancelAbsence(slotInfo.substitutionId);
            onSuccess();
            router.refresh();
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to cancel');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <h3 className="text-lg font-bold mb-2 text-gray-800">
                    Manage Slot: {format(slotInfo.date, 'dd/MM/yyyy')}
                </h3>
                <p className="text-gray-600 mb-6">{slotInfo.dayName}, Hour {slotInfo.hourTime}</p>

                {step === 'VIEW' && (
                    <div className="space-y-4">
                        {!slotInfo.currentStatus && (
                            <div className="bg-gray-50 border p-4 rounded-lg space-y-6" dir="rtl">
                                <div>
                                    <h4 className="font-semibold mb-2 text-gray-700">סימון היעדרות במערכת</h4>
                                    <select
                                        value={absenceType}
                                        onChange={(e) => setAbsenceType(e.target.value)}
                                        className="w-full mb-3 border border-gray-300 rounded p-2 text-sm"
                                    >
                                        <option value="SICK">מחלה (Sick)</option>
                                        <option value="VACATION">חופשה (Vacation)</option>
                                        <option value="WORK_OUT">עבודה מחוץ לביה"ס (Work out of school)</option>
                                    </select>
                                    <button
                                        onClick={handleMarkAbsence}
                                        disabled={loading || !slotInfo.scheduleId}
                                        className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50"
                                    >
                                        סמן כהיעדרות
                                    </button>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-2 text-gray-700">הוספת שעה נוספת (מילוי מקום חופשי)</h4>
                                    <input
                                        type="text"
                                        placeholder="הערות למילוי המקום (אופציונלי)"
                                        value={extraNotes}
                                        onChange={(e) => setExtraNotes(e.target.value)}
                                        className="w-full mb-3 border border-gray-300 rounded p-2 text-sm"
                                    />
                                    <button
                                        onClick={handleAddExtraClass}
                                        disabled={loading}
                                        className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                                    >
                                        שייך שעה נוספת
                                    </button>
                                </div>
                            </div>
                        )}

                        {slotInfo.currentStatus === 'ABSENT' && !slotInfo.isExtra && (
                            <>
                                <div className="p-3 bg-red-100 text-red-800 rounded text-center font-medium">
                                    סטטוס נוכחי: נעדר/ת
                                    {slotInfo.absenceType === 'WORK_OUT' && <span className="block text-xs font-normal">עבודה מחוץ לביה"ס</span>}
                                    {slotInfo.absenceType === 'VACATION' && <span className="block text-xs font-normal">חופשה</span>}
                                    {slotInfo.absenceType === 'SICK' && <span className="block text-xs font-normal">מחלה</span>}
                                </div>
                                <button
                                    onClick={handleFetchTeachers}
                                    disabled={loading}
                                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                                >
                                    שבץ מחליף/ה
                                </button>
                                <button
                                    onClick={handleCancelAbsence}
                                    disabled={loading}
                                    className="w-full py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    בטל היעדרות
                                </button>
                            </>
                        )}

                        {slotInfo.currentStatus === 'COVERED' && slotInfo.isExtra && (
                            <>
                                <div className="p-3 bg-purple-100 text-purple-800 rounded text-center font-medium">
                                    סטטוס: שעה נוספת
                                    {slotInfo.substituteName && <span className="block text-xs font-normal">ממלא מקום: {slotInfo.substituteName}</span>}
                                </div>
                                <button
                                    onClick={handleRemoveExtraClass}
                                    disabled={loading}
                                    className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold shadow-sm"
                                >
                                    מחק שעה נוספת
                                </button>
                            </>
                        )}

                        {slotInfo.currentStatus === 'COVERED' && !slotInfo.isExtra && (
                            <>
                                <div className="p-3 bg-green-100 text-green-800 rounded text-center font-medium">
                                    ממלא מקום: {slotInfo.substituteName}
                                </div>
                                <button
                                    onClick={handleCancelAbsence}
                                    disabled={loading}
                                    className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-semibold"
                                >
                                    בטל השמה / החזר למצב רגיל
                                </button>
                            </>
                        )}
                    </div>
                )}

                {step === 'ASSIGN' && (
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-700">Select Substitute:</h4>
                        <div className="max-h-60 overflow-y-auto border rounded divide-y">
                            {availableTeachers.map(t => {
                                let bgClass = 'hover:bg-gray-50';
                                let badgeClass = 'bg-gray-100 text-gray-600';

                                if (t.status === 'FREE') {
                                    bgClass = 'hover:bg-emerald-50';
                                    badgeClass = 'bg-emerald-100 text-emerald-700';
                                } else if (t.status === 'STAY') {
                                    bgClass = 'hover:bg-amber-50';
                                    badgeClass = 'bg-amber-100 text-amber-700';
                                } else if (t.status === 'INDIVIDUAL') {
                                    bgClass = 'hover:bg-purple-50';
                                    badgeClass = 'bg-purple-100 text-purple-700';
                                } else if (t.status === 'BUSY_CLASS' || t.status === 'BUSY_SUB') {
                                    bgClass = 'hover:bg-rose-50 opacity-70';
                                    badgeClass = 'bg-rose-100 text-rose-700';
                                }

                                const isOfficialSub = t.type === 'SUBSTITUTE';

                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTeacher(t.id)}
                                        className={`w-full text-right p-3 flex justify-between items-center transition-colors group ${bgClass} ${selectedTeacher === t.id ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50' : ''}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`font-medium ${isOfficialSub ? 'text-indigo-700' : 'text-gray-700'}`}>
                                                {t.lastName} {t.firstName}
                                            </span>
                                            {isOfficialSub && (
                                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1 rounded border border-indigo-200">מ"מ</span>
                                            )}
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${badgeClass}`}>
                                            {t.label}
                                        </span>
                                    </button>
                                );
                            })}
                            {availableTeachers.length === 0 && (
                                <div className="p-4 text-center text-gray-500">No available teachers found.</div>
                            )}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setStep('VIEW')}
                                className="w-1/3 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleAssign}
                                disabled={!selectedTeacher || loading}
                                className="w-2/3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                                {loading ? 'Assigning...' : 'Confirm Assignment'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'VIEW' && (
                    <button
                        onClick={onClose}
                        className="mt-6 w-full py-2 text-gray-500 hover:text-gray-700"
                    >
                        Close
                    </button>
                )}
            </div>
        </div>
    );
}
