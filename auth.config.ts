import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;

            // Define paths to protect
            // For now, let's protect the root '/' and any subpaths except public ones
            const isPublicPath =
                nextUrl.pathname.startsWith('/login') ||
                nextUrl.pathname.startsWith('/api/') || // Allow APIs for now or handle specifically?
                nextUrl.pathname.startsWith('/_next') ||
                nextUrl.pathname.startsWith('/static');

            // But wait, /api/teachers and /api/schedule are used by the frontend. 
            // If the frontend is protected, the user is logged in, so api requests satisfy middleware?
            // Yes, if cookie is present.

            // However, initial load of /login calls nothing protected.

            const isLoginPage = nextUrl.pathname.startsWith('/login');

            if (isLoginPage) {
                if (isLoggedIn) {
                    return Response.redirect(new URL('/', nextUrl));
                }
                return true;
            }

            if (!isLoggedIn && !isPublicPath) {
                // Allow /api/auth always
                if (nextUrl.pathname.startsWith('/api/auth')) return true;

                return false; // Redirect to login
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
            }
            return session
        },
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
