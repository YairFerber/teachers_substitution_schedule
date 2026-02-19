'use client';

import { signOutAction } from '@/app/lib/signout';

export default function SignOutButton() {
    return (
        <form action={signOutAction}>
            <button
                className="text-sm text-gray-500 hover:text-red-500 underline transition-colors"
            >
                Sign Out
            </button>
        </form>
    );
}
