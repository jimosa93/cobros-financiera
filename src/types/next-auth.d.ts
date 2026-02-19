import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      rol?: 'ADMIN' | 'COBRADOR';
      rutaId?: number | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    rol?: 'ADMIN' | 'COBRADOR';
    rutaId?: number | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    rol?: 'ADMIN' | 'COBRADOR';
    rutaId?: number | null;
  }
}
