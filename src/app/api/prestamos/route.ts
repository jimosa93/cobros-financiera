import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// GET: List, search, paginate préstamos
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || '';
    const rutaIdParam = searchParams.get('rutaId');

    const clienteIdParam = searchParams.get('clienteId');
    const where: Prisma.PrestamoWhereInput = {};

    const userRutaIds = Array.isArray(user.rutaIds) ? user.rutaIds : [];
    if (user.rol === 'USUARIO') {
      if (userRutaIds.length === 0) {
        return NextResponse.json({ prestamos: [], total: 0 });
      }
      if (rutaIdParam) {
        const selectedRutaId = parseInt(rutaIdParam, 10);
        if (!userRutaIds.includes(selectedRutaId)) {
          return NextResponse.json({ prestamos: [], total: 0 });
        }
        where.rutaId = selectedRutaId;
      } else {
        where.rutaId = { in: userRutaIds };
      }
    } else if (user.rol === 'ADMIN' && rutaIdParam) {
      where.rutaId = parseInt(rutaIdParam);
    }

    if (clienteIdParam) {
      where.clienteId = Number(clienteIdParam);
    } else if (search) {
      where.OR = [
        { notas: { contains: search, mode: 'insensitive' } },
        { cliente: { nombreCompleto: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const total = await prisma.prestamo.count({ where });
    const prestamos = await prisma.prestamo.findMany({
      where,
      orderBy: { orden: 'asc' },
      include: { cliente: true, cobrador: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return NextResponse.json({ prestamos, total });
  } catch (error) {
    console.error('Error listing prestamos:', error);
    return NextResponse.json({ error: 'Error al listar préstamos' }, { status: 500 });
  }
}

// POST: Crear nuevo préstamo
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const permisoRows = await prisma.usuarioPermiso.findMany({
      where: { usuarioId: user.id },
      select: { permiso: true },
    });
    const permisos = new Set(permisoRows.map((p) => String(p.permiso)));
    const canCreate = user.rol === 'ADMIN' || permisos.has('PRESTAMOS_CREATE');
    if (!canCreate) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const body = await request.json();
    const {
      clienteId, montoPrestado, tasa, cuotas, fechaInicio, notas, cobradorId, rutaId
    } = body;
    if (!clienteId || !montoPrestado || !tasa || !cuotas || !fechaInicio) {
      return NextResponse.json({ error: 'Campo faltante o inválido en el formulario' }, { status: 400 });
    }
    if (!rutaId) {
      return NextResponse.json({ error: 'La ruta es requerida' }, { status: 400 });
    }
    const rutaNum = Number(rutaId);
    if (user.rol !== 'ADMIN') {
      const userRutaIds = Array.isArray(user.rutaIds) ? user.rutaIds : [];
      if (!userRutaIds.includes(rutaNum)) {
        return NextResponse.json({ error: 'Ruta no permitida para tu usuario' }, { status: 400 });
      }
    }
    const clienteRuta = await prisma.clienteRuta.findFirst({
      where: { clienteId: Number(clienteId), rutaId: rutaNum },
      select: { clienteId: true },
    });
    if (!clienteRuta) {
      return NextResponse.json({ error: 'El cliente no está asignado a la ruta seleccionada' }, { status: 400 });
    }
    const ultimo = await prisma.prestamo.findFirst({ orderBy: { orden: 'desc' } });
    const orden = ultimo ? (ultimo.orden + 1) : 1;
    const prestamo = await prisma.prestamo.create({
      data: {
        clienteId: Number(clienteId),
        montoPrestado: String(montoPrestado),
        tasa: parseFloat(tasa),
        cuotas: Number(cuotas),
        fechaInicio: new Date(fechaInicio),
        notas: notas || null,
        cobradorId: Number(cobradorId || user.id),
        rutaId: rutaNum,
        orden,
      },
    });
    return NextResponse.json({ prestamo });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
