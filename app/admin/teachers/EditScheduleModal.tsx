'use client';

import React, { useState, useEffect } from 'react';
import { ScheduleItem } from '../../types'; // Adjust path based on location

interface ClassOption {
    id: string;
    name: string;
}

interface EditScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { subject: string; className: string; type: string }) => Promise<void>;
    onDelete: () => Promise<void>;
    initialData?: ScheduleItem;
    // classes: ClassOption[]; // Not strictly needed if free text, but could be used for datalist
    slotInfo: { day: string; hour: string };
}

export default function EditScheduleModal({ isOpen, onClose, onSave, onDelete, initialData, slotInfo }: EditScheduleModalProps) {
    const [subject, setSubject] = useState('');
    const [className, setClassName] = useState('');
    const [type, setType] = useState('REGULAR');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSubject(initialData?.subject || '');
            setClassName(initialData?.class?.name || '');
            setType(initialData?.type || 'REGULAR');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave({ subject, className: className, type });
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to save');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to clear this slot?')) return;
        setLoading(true);
        try {
            await onDelete();
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to delete');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <h3 className="text-lg font-bold mb-4 text-gray-800">
                    Edit Schedule: {slotInfo.day}, Hour {slotInfo.hour}
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-gray-900"
                        >
                            <option value="FREE">Free (Empty)</option>
                            <option value="REGULAR">Regular Class</option>
                            <option value="STAY">Shahiya (Stay)</option>
                            <option value="INDIVIDUAL">Partani (Individual)</option>
                            <option value="MEETING">Meeting</option>
                        </select>
                    </div>

                    {type !== 'FREE' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g. Math, History"
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Class Name</label>
                                <input
                                    type="text"
                                    value={className}
                                    onChange={(e) => setClassName(e.target.value)}
                                    placeholder="e.g. Grade 10A"
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-gray-900"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-6 flex justify-between">
                    {initialData ? (
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                            Clear Slot
                        </button>
                    ) : <div></div>}

                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
