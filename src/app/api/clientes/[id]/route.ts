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
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden editar clientes.' },
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
    const { nombreCompleto, celular, direccionNegocio, direccionVivienda } = body;

    if (!nombreCompleto || !celular) {
      return NextResponse.json(
        { error: 'Nombre completo y celular son requeridos' },
        { status: 400 }
      );
    }

    const clienteActualizado = await prisma.cliente.update({
      where: { id },
      data: {
        nombreCompleto,
        celular,
        direccionNegocio: direccionNegocio || null,
        direccionVivienda: direccionVivienda || null,
      },
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
