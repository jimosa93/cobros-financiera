import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      rol?: 'ADMIN' | 'USUARIO';
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    rol?: 'ADMIN' | 'USUARIO';
  }
}

export {};

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    rol?: 'ADMIN' | 'USUARIO';
  }
}
