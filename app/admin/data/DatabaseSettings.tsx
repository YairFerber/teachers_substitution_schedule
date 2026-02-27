'use client';

import { useState, useEffect } from 'react';

declare global {
    interface Window {
        electronAPI?: {
            getDbConfig: () => Promise<{
                externalDbPath: string | null;
                internalDbPath: string;
                activeDbPath: string;
            }>;
            showDbPicker: () => Promise<{
                success: boolean;
                path?: string;
            }>;
            resetDbLocation: () => Promise<{
                success: boolean;
            }>;
            relaunch: () => void;
        };
    }
}

export default function DatabaseSettings() {
    const [config, setConfig] = useState<{
        externalDbPath: string | null;
        internalDbPath: string;
        activeDbPath: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        // Only run on desktop (Electron)
        if (typeof window !== 'undefined' && window.electronAPI) {
            setIsDesktop(true);
            loadConfig();
        } else {
            setLoading(false);
        }
    }, []);

    const loadConfig = async () => {
        if (!window.electronAPI) return;
        try {
            const cfg = await window.electronAPI.getDbConfig();
            setConfig(cfg);
        } catch (err) {
            console.error('Failed to load DB config:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChangeLocation = async () => {
        if (!window.electronAPI) return;
        const result = await window.electronAPI.showDbPicker();
        if (result.success) {
            if (confirm('Database location changed. The application needs to restart to apply the changes. Restart now?')) {
                window.electronAPI.relaunch();
            } else {
                loadConfig();
            }
        }
    };

    const handleReset = async () => {
        if (!window.electronAPI) return;
        if (!confirm('Are you sure you want to reset to the default internal database location?')) return;

        const result = await window.electronAPI.resetDbLocation();
        if (result.success) {
            if (confirm('Database location reset. The application needs to restart to apply the changes. Restart now?')) {
                window.electronAPI.relaunch();
            } else {
                loadConfig();
            }
        }
    };

    if (!isDesktop) return null;

    if (loading) return (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
        </div>
    );

    const isExternal = !!config?.externalDbPath;

    return (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-indigo-500">
            <div className="flex justify-between items-start mb-4 border-b pb-2">
                <h2 className="text-xl font-semibold text-gray-700">Database Sync / Location</h2>
                <span className={`px-2 py-1 rounded text-xs font-bold ${isExternal ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                    {isExternal ? 'EXTERNAL / CLOUD' : 'INTERNAL LOCAL'}
                </span>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Active Database Path:</label>
                    <div className="bg-gray-50 p-2 rounded border border-gray-200 text-xs font-mono break-all text-gray-600">
                        {config?.activeDbPath}
                    </div>
                </div>

                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex gap-3">
                        <span className="text-xl">☁️</span>
                        <div>
                            <h4 className="text-sm font-bold text-amber-800">Cloud Sync (Google Drive / OneDrive)</h4>
                            <p className="text-xs text-amber-700 mt-1">
                                To sync across multiple devices:
                                <ol className="list-decimal mr-4 mt-1 space-y-1">
                                    <li>Install the Cloud Drive app (Google Drive, etc.) on this PC.</li>
                                    <li>Place your <strong>dev.db</strong> file inside the sync folder.</li>
                                    <li>Click "Change Location" below and select that file.</li>
                                    <li>Repeat on other PCs pointing to the same file.</li>
                                </ol>
                                <strong className="block mt-2 text-red-700">⚠️ IMPORTANT: Do not open the app on two PCs at the same time! This can cause data corruption.</strong>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                    <button
                        onClick={handleChangeLocation}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm font-bold shadow-sm"
                    >
                        📂 Change DB Location
                    </button>

                    {isExternal && (
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
                        >
                            🔄 Reset to Default
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
