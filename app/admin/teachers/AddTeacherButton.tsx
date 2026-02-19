'use client';

import React, { useState } from 'react';
import AddTeacherModal from './AddTeacherModal';

export default function AddTeacherButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm flex items-center gap-2"
            >
                <span>+</span> Add Teacher
            </button>
            <AddTeacherModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
