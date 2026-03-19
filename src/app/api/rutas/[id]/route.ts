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
    select: { id: true, rol: true, permisos: { select: { permiso: true } } },
  });
  if (!user) return null;
  const userRutas = await prisma.usuarioRuta.findMany({
    where: { usuarioId: user.id },
    select: { rutaId: true },
  });
  return {
    id: user.id,
    rol: user.rol as Rol,
    rutaIds: userRutas.map((r) => r.rutaId),
    permisos: (user.permisos ?? []).map((p) => String(p.permiso)),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    // Allow admins. Non-admins must have RUTAS_READ.
    if (user.rol !== 'ADMIN' && !user.permisos.includes('RUTAS_READ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ruta = await prisma.ruta.findUnique({
      where: { id: idNum },
      include: {
        usuarioRutas: {
          select: {
            usuario: {
              select: {
                id: true,
                nombreCompleto: true,
                email: true,
                rol: true,
              },
            },
          },
        },
        _count: {
          select: {
            clienteRutas: true,
            prestamos: true,
          },
        },
      },
    });

    if (!ruta) {
      return NextResponse.json(
        { error: 'Ruta no encontrada' },
        { status: 404 }
      );
    }

    const rutaWithUsuarios = {
      ...ruta,
      usuarios: ruta.usuarioRutas.map((ur) => ur.usuario),
    };
    return NextResponse.json({ ruta: rutaWithUsuarios });
  } catch (error) {
    console.error('Error fetching ruta:', error);
    return NextResponse.json(
      { error: 'Error al obtener ruta' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    if (user.rol !== 'ADMIN' && !user.permisos.includes('RUTAS_UPDATE')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { nombre, activo } = body;

    const updateData: { nombre?: string; activo?: boolean } = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (activo !== undefined) updateData.activo = activo;

    const rutaActualizada = await prisma.ruta.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json({ ruta: rutaActualizada });
  } catch (error) {
    console.error('Error updating ruta:', error);
    return NextResponse.json(
      { error: 'Error al actualizar ruta' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    if (user.rol !== 'ADMIN' && !user.permisos.includes('RUTAS_DELETE')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const rutaId = parseInt(id);

    const counts = await prisma.ruta.findUnique({
      where: { id: rutaId },
      select: {
        _count: {
          select: {
            clienteRutas: true,
            prestamos: true,
            usuarioRutas: true,
          },
        },
      },
    });

    if (counts && (counts._count.clienteRutas > 0 || counts._count.prestamos > 0 || counts._count.usuarioRutas > 0)) {
      return NextResponse.json(
        { error: 'No se puede eliminar una ruta con clientes, préstamos o usuarios asociados. Desactívala en su lugar.' },
        { status: 400 }
      );
    }

    await prisma.ruta.delete({
      where: { id: rutaId },
    });

    return NextResponse.json({ message: 'Ruta eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting ruta:', error);
    return NextResponse.json(
      { error: 'Error al eliminar ruta' },
      { status: 500 }
    );
  }
}
