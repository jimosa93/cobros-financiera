import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text', placeholder: 'correo@correo.com' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) return null;

                const user = await prisma.usuario.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || !user.password) return null;

                const isValid = await compare(credentials.password, user.password);
                if (!isValid) return null;

                return {
                    id: String(user.id),
                    name: user.nombreCompleto,
                    email: user.email,
                    rol: user.rol,
                };
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub || '';
                session.user.rol = token.rol as 'ADMIN' | 'COBRADOR';
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.rol = (user as any).rol;
            }
            return token;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt' as const,
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
