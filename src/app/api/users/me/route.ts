import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const full = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      nombreCompleto: true,
      email: true,
      rol: true,
      alias: true,
      permisos: { select: { permiso: true } },
    },
  });

  if (!full) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const rutas = await prisma.usuarioRuta.findMany({
    where: { usuarioId: full.id },
    select: { rutaId: true },
  });
  const { permisos: permRows, ...rest } = full;
  return NextResponse.json({
    user: {
      ...rest,
      rutaIds: (rutas ?? []).map((r) => r.rutaId),
      permisos: (permRows ?? []).map((p) => p.permiso),
    },
  });
}

