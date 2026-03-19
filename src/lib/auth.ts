import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from './prisma';

export async function getSession() {
  const session = await getServerSession(authOptions);
  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.email) return null;

  const user = await prisma.usuario.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      nombreCompleto: true,
      email: true,
      rol: true,
      alias: true,
    },
  });

  if (!user) return null;

  const userRutas = await prisma.usuarioRuta.findMany({
    where: { usuarioId: user.id },
    select: { rutaId: true },
  });

  return {
    ...user,
    rutaIds: userRutas.map((r) => r.rutaId),
  };
}
