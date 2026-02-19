'use client';

import React from 'react';
import { Teacher } from '../types';

interface TeacherSelectorProps {
    teachers: Teacher[];
    selectedTeacherId: string | null;
    onSelect: (teacherId: string) => void;
}

export default function TeacherSelector({ teachers, selectedTeacherId, onSelect }: TeacherSelectorProps) {
    return (
        <div className="mb-6">
            <label htmlFor="teacher-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Teacher / בחר מורה
            </label>
            <select
                id="teacher-select"
                value={selectedTeacherId || ''}
                onChange={(e) => onSelect(e.target.value)}
                className="block w-full max-w-md p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
                <option value="" disabled>-- Select a Teacher --</option>
                {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                        {teacher.lastName} {teacher.firstName}
                    </option>
                ))}
            </select>
        </div>
    );
}
