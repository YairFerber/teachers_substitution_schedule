'use client';

import React, { useState } from 'react';
import { updateTeacher } from './actions';
import { useRouter } from 'next/navigation';

interface TeacherProfileCardProps {
    teacher: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        user?: {
            username: string;
        } | null;
    };
}

export default function TeacherProfileCard({ teacher }: TeacherProfileCardProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        phone: teacher.phone,
        username: teacher.user?.username || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateTeacher(teacher.id, formData);
            setIsEditing(false);
            router.refresh(); // Refresh server data
        } catch (error) {
            console.error(error);
            alert('Failed to update teacher info');
        } finally {
            setIsLoading(false);
        }
    };

    if (isEditing) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800">Edit Profile</h2>
                    <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Login Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-2 border-blue-200 p-2 text-gray-900 bg-blue-50 focus:border-blue-500 focus:ring-0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-gray-900"
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">{teacher.firstName} {teacher.lastName}</h2>
                    <div className="text-gray-600 grid grid-cols-2 gap-x-8 gap-y-2">
                        <p className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">Username:</span>
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono text-sm border border-blue-100">
                                {teacher.user?.username || 'N/A'}
                            </span>
                        </p>
                        <p><span className="font-medium">Email:</span> {teacher.email}</p>
                        <p><span className="font-medium">Phone:</span> {teacher.phone}</p>
                        <p><span className="font-medium">Teacher ID:</span> {teacher.id}</p>
                    </div>
                </div>
                <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                        {teacher.firstName[0]}{teacher.lastName[0]}
                    </div>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                        Edit Info
                    </button>
                </div>
            </div>
        </div>
    );
}
