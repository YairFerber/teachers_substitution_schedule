'use client'

import { useActionState } from 'react' // or useRequest state if useActionState not available in this react version. 
// Next.js 15 uses React 19 which has useActionState. Next.js 14 uses useFormState from react-dom.
// Package.json says "react": "19.2.3". So useActionState is correct.
import { authenticate } from '@/app/lib/actions'

export default function LoginForm() {
    const [errorMessage, formAction, isPending] = useActionState(
        authenticate,
        undefined,
    )

    return (
        <form action={formAction} className="space-y-3">
            <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
                <h1 className="mb-3 text-2xl font-bold font-sans text-gray-900">
                    Please log in to continue.
                </h1>
                <div className="w-full">
                    <div>
                        <div>
                            <label
                                className="mb-3 mt-5 block text-xs font-medium text-gray-900"
                                htmlFor="username"
                            >
                                Username
                            </label>
                            <div className="relative">
                                <input
                                    className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 text-gray-900"
                                    id="username"
                                    type="text"
                                    name="username"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label
                                className="mb-3 mt-5 block text-xs font-medium text-gray-900"
                                htmlFor="pin"
                            >
                                PIN Code
                            </label>
                            <div className="relative">
                                <input
                                    className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 text-gray-900"
                                    id="pin"
                                    type="password"
                                    name="pin"
                                    placeholder="Enter PIN"
                                    required
                                    minLength={4}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    className="mt-4 w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                    aria-disabled={isPending}
                >
                    Log in
                </button>
                <div
                    className="flex h-8 items-end space-x-1"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {errorMessage && (
                        <p className="text-sm text-red-500">{errorMessage}</p>
                    )}
                </div>
            </div>
        </form>
    )
}
