'use client';

import React, { useState } from 'react';
import { resetPin, deleteTeacher } from './actions';

interface TeacherRowProps {
    user: any; // Using any for simplicity with Prisma types in client component, or define interface
}

export default function TeacherRow({ user }: TeacherRowProps) {
    const [displayPin, setDisplayPin] = useState(user.displayPin);
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPin = async () => {
        if (!confirm(`Are you sure you want to reset the PIN for ${user.name}?`)) return;

        setIsLoading(true);
        try {
            const newPin = await resetPin(user.id);
            setDisplayPin(newPin);
            alert(`New PIN for ${user.name}: ${newPin}`);
        } catch (error) {
            alert('Failed to reset PIN');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete ${user.name}? This cannot be undone.`)) {
            await deleteTeacher(user.teacher!.id);
            // The row will be removed by revalidatePath triggering a server refresh, 
            // but we can also hide it locally or just wait.
        }
    };

    return (
        <tr key={user.email} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                {user.teacher ? (
                    <a href={`/admin/teachers/${user.teacher.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                        {user.name}
                    </a>
                ) : (
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono bg-gray-50 px-2 rounded w-fit">
                {user.username}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono font-bold tracking-widest">
                {displayPin || '****'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.teacher?.email || user.email || '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.teacher?.phone || '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                <button
                    onClick={handleResetPin}
                    disabled={isLoading}
                    className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                >
                    {isLoading ? 'Resetting...' : 'Reset PIN'}
                </button>
                <button
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-900"
                >
                    Delete
                </button>
            </td>
        </tr>
    );
}
