import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// GET - Obtener un cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        rutas: {
          select: {
            rutaId: true,
            ruta: { select: { id: true, nombre: true, activo: true } },
          },
        },
        prestamos: {
          include: {
            cobrador: {
              select: {
                id: true,
                nombreCompleto: true,
                alias: true,
              },
            },
          },
          orderBy: { fechaInicio: 'desc' },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }
    if (user.rol !== 'ADMIN') {
      const userRutaIds = Array.isArray(user.rutaIds) ? user.rutaIds : [];
      const hasAllowedRuta = cliente.rutas.some((r) => userRutaIds.includes(r.rutaId));
      if (!hasAllowedRuta) {
        return NextResponse.json(
          { error: 'No autorizado para ver este cliente' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ cliente });
  } catch (error) {
    console.error('Error fetching cliente:', error);
    return NextResponse.json(
      { error: 'Error al obtener cliente' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    const permisoRows = await prisma.usuarioPermiso.findMany({
      where: { usuarioId: user.id },
      select: { permiso: true },
    });
    const permisos = new Set(permisoRows.map((p) => String(p.permiso)));
    const canUpdate = user.rol === 'ADMIN' || permisos.has('CLIENTES_UPDATE');
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'No autorizado para editar clientes.' },
        { status: 401 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { nombreCompleto, celular, direccionNegocio, direccionVivienda, rutaIds } = body;

    if (!nombreCompleto || !celular) {
      return NextResponse.json(
        { error: 'Nombre completo y celular son requeridos' },
        { status: 400 }
      );
    }

    const normalizedRutaIds = Array.isArray(rutaIds)
      ? rutaIds.map((routeId: unknown) => Number(routeId)).filter((routeId: number) => Number.isFinite(routeId))
      : [];

    if (normalizedRutaIds.length === 0) {
      return NextResponse.json(
        { error: 'Debe asignar al menos una ruta' },
        { status: 400 }
      );
    }
    if (user.rol !== 'ADMIN') {
      const userRutaIds = Array.isArray(user.rutaIds) ? user.rutaIds : [];
      const invalidRuta = normalizedRutaIds.find((routeId) => !userRutaIds.includes(routeId));
      if (invalidRuta) {
        return NextResponse.json(
          { error: 'Solo puedes asignar rutas permitidas para tu usuario.' },
          { status: 400 }
        );
      }
      const existingCliente = await prisma.cliente.findUnique({
        where: { id },
        include: { rutas: { select: { rutaId: true } } },
      });
      if (!existingCliente) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
      }
      const canEditCliente = existingCliente.rutas.some((r) => userRutaIds.includes(r.rutaId));
      if (!canEditCliente) {
        return NextResponse.json(
          { error: 'No autorizado para editar este cliente' },
          { status: 403 }
        );
      }
    }

    const clienteActualizado = await prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.update({
        where: { id },
        data: {
          nombreCompleto,
          celular,
          direccionNegocio: direccionNegocio || null,
          direccionVivienda: direccionVivienda || null,
        },
      });

      await tx.clienteRuta.deleteMany({ where: { clienteId: id } });
      await tx.clienteRuta.createMany({
        data: normalizedRutaIds.map((routeId: number) => ({ clienteId: id, rutaId: routeId })),
        skipDuplicates: true,
      });

      return cliente;
    });

    return NextResponse.json({ cliente: clienteActualizado });
  } catch (error) {
    console.error('Error updating cliente:', error);
    if ((error as PrismaClientKnownRequestError).code === 'P2025') {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden eliminar clientes.' },
        { status: 401 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar si el cliente tiene préstamos
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        prestamos: {
          select: { id: true },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    if (cliente.prestamos.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un cliente que tiene préstamos asociados' },
        { status: 400 }
      );
    }

    await prisma.cliente.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Cliente eliminado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting cliente:', error);
    if ((error as PrismaClientKnownRequestError).code === 'P2025') {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    );
  }
}
