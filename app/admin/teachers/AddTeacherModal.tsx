'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// Import the server action directly (defined above in a separate file, need to ensure correct import)
// We need to define addTeacher actions in a separate 'use server' file to import it in client component
// But I defined it in `add-teacher-action.ts` so it's good.
import { addTeacher } from './add-teacher-action';

export default function AddTeacherModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        type: 'REGULAR',
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await addTeacher(formData);
            if (result.success) {
                alert(`Teacher added!\nUsername: ${result.username}\nPIN: ${result.pin}`);
                router.refresh();
                onClose();
            }
        } catch (error) {
            console.error(error);
            alert('Failed to add teacher');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <h3 className="text-lg font-bold mb-4 text-gray-800">Add New Teacher</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            <input
                                required
                                type="text"
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                                required
                                type="text"
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Teacher Type</label>
                        <select
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="REGULAR">Regular Teacher</option>
                            <option value="SUBSTITUTE">Substitute Teacher</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Teacher'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
