import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const ruta = await prisma.ruta.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuarios: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true,
            rol: true,
          },
        },
        _count: {
          select: {
            clientes: true,
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

    return NextResponse.json({ ruta });
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
    const user = await getCurrentUser();
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
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
    const user = await getCurrentUser();
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const rutaId = parseInt(id);

    const counts = await prisma.ruta.findUnique({
      where: { id: rutaId },
      select: {
        _count: {
          select: {
            clientes: true,
            prestamos: true,
            usuarios: true,
          },
        },
      },
    });

    if (counts && (counts._count.clientes > 0 || counts._count.prestamos > 0 || counts._count.usuarios > 0)) {
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
