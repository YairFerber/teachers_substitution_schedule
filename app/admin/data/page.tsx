'use client';

import { useState } from 'react';

export default function DataManagementPage() {
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) {
            setMessage({ type: 'error', text: 'Please select a file first.' });
            return;
        }

        if (!confirm('WARNING: This will overwrite the current schedule data. Are you sure?')) {
            return;
        }

        setUploading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/admin/data/import', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Import failed');
            }

            setMessage({ type: 'success', text: 'Database updated successfully!' });
            setFile(null);
            // Reset file input value?
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (err) {
            setMessage({ type: 'error', text: (err as Error).message });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Data Management</h1>
                    <a href="/admin/teachers" className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Back</a>
                </div>

                {/* Export Section */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Export Data</h2>
                    <div className="flex gap-4">
                        <a
                            href="/api/admin/data/export/full"
                            target="_blank"
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                        >
                            <span>📑</span> Download Full Schedule (Excel)
                        </a>
                        <a
                            href="/api/admin/data/export/subs"
                            target="_blank"
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                        >
                            <span>👥</span> Download Substitute List
                        </a>
                    </div>
                </div>

                {/* Import Section */}
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
                    <h2 className="text-xl font-semibold text-red-700 mb-4 border-b pb-2">Import Data (Overwrite)</h2>
                    <p className="text-gray-600 mb-6">
                        Upload a new Excel file to replace the current schedule. <br />
                        <span className="font-bold text-red-600">Warning: This action cannot be undone.</span>
                    </p>

                    <div className="flex flex-col gap-4 max-w-md">
                        <input
                            id="file-upload"
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-red-50 file:text-red-700
                                hover:file:bg-red-100
                            "
                        />

                        <button
                            onClick={handleImport}
                            disabled={!file || uploading}
                            className={`px-6 py-3 rounded-lg font-bold text-white shadow-sm transition-all
                                ${!file || uploading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700 hover:shadow-md'
                                }
                            `}
                        >
                            {uploading ? 'Importing...' : '⚠️ Upload & Overwrite Database'}
                        </button>
                    </div>

                    {message && (
                        <div className={`mt-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            {message.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
