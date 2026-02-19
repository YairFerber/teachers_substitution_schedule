import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
        Credentials({
            credentials: {
                username: { label: "Username", type: "text" },
                pin: { label: "PIN", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.username || !credentials?.pin) {
                    return null
                }

                const username = credentials.username as string
                const pin = credentials.pin as string

                const user = await prisma.user.findUnique({
                    where: { username },
                    include: { teacher: true }, // Include teacher data
                })

                if (!user || !user.password) {
                    return null
                }

                const isValid = await bcrypt.compare(pin, user.password)

                if (!isValid) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    teacherId: user.teacher?.id, // Pass teacherId
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
                token.id = user.id
                token.teacherId = (user as any).teacherId
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
                (session.user as any).teacherId = token.teacherId;
            }
            return session
        },
    },
})
