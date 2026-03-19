import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { type Rol } from '@prisma/client';

async function getAuthUser(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) return null;

  const id = parseInt(token.sub, 10);
  if (!Number.isFinite(id)) return null;

  const user = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      rol: true,
      rutaId: true,
      permisos: { select: { permiso: true } },
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    rol: user.rol as Rol,
    rutaId: user.rutaId,
    permisos: (user.permisos ?? []).map((p) => String(p.permiso)),
  };
}

function hasAnyRutaPermiso(permisos: string[]) {
  return permisos.some((p) =>
    p === 'RUTAS_READ' || p === 'RUTAS_CREATE' || p === 'RUTAS_UPDATE' || p === 'RUTAS_DELETE'
  );
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // ADMIN: see all routes (optionally inactive). Non-admin: requires RUTAS_READ to list routes.
    if (user.rol !== 'ADMIN') {
      if (!user.permisos.includes('RUTAS_READ') && !hasAnyRutaPermiso(user.permisos)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      const rutas = await prisma.ruta.findMany({
        where: includeInactive ? {} : { activo: true },
        orderBy: { fechaCreacion: 'desc' },
        include: {
          _count: { select: { clientes: true, prestamos: true, usuarios: true } },
        },
      });
      return NextResponse.json({ rutas });
    }

    const rutas = await prisma.ruta.findMany({
      where: includeInactive ? {} : { activo: true },
      orderBy: { fechaCreacion: 'desc' },
      include: {
        _count: { select: { clientes: true, prestamos: true, usuarios: true } },
      },
    });

    return NextResponse.json({ rutas });
  } catch (error) {
    console.error('Error fetching rutas:', error);
    return NextResponse.json(
      { error: 'Error al obtener rutas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    if (user.rol !== 'ADMIN' && !user.permisos.includes('RUTAS_CREATE')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre } = body;

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const nuevaRuta = await prisma.ruta.create({
      data: {
        nombre,
        activo: true,
        fechaCreacion: new Date(),
      },
    });

    return NextResponse.json(
      { ruta: nuevaRuta },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating ruta:', error);
    return NextResponse.json(
      { error: 'Error al crear ruta' },
      { status: 500 }
    );
  }
}
