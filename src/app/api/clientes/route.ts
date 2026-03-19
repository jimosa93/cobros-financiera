import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET - Listar clientes (con paginación y búsqueda opcional)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const rutaIdParam = searchParams.get('rutaId');

    const skip = (page - 1) * limit;

    const baseWhere: Prisma.ClienteWhereInput = {};

    if (user.rol === 'USUARIO') {
      const userRutaIds = Array.isArray(user.rutaIds) ? user.rutaIds : [];
      if (userRutaIds.length === 0) {
        return NextResponse.json({
          clientes: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
      if (rutaIdParam) {
        const selectedRutaId = parseInt(rutaIdParam, 10);
        if (!userRutaIds.includes(selectedRutaId)) {
          return NextResponse.json({
            clientes: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          });
        }
        baseWhere.rutas = { some: { rutaId: selectedRutaId } };
      } else {
        baseWhere.rutas = { some: { rutaId: { in: userRutaIds } } };
      }
    } else if (user.rol === 'ADMIN' && rutaIdParam) {
      baseWhere.rutas = { some: { rutaId: parseInt(rutaIdParam) } };
    }

    const where = search
      ? {
        ...baseWhere,
        OR: [
          { nombreCompleto: { contains: search, mode: 'insensitive' as const } },
          { celular: { contains: search, mode: 'insensitive' as const } },
          { direccionNegocio: { contains: search, mode: 'insensitive' as const } },
          { direccionVivienda: { contains: search, mode: 'insensitive' as const } },
        ],
      }
      : baseWhere;

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaCreacion: 'desc' },
        include: {
          rutas: {
            select: {
              rutaId: true,
              ruta: { select: { id: true, nombre: true, activo: true } },
            },
          },
          prestamos: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.cliente.count({ where }),
    ]);

    return NextResponse.json({
      clientes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching clientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
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
    const canCreate = user.rol === 'ADMIN' || permisos.has('CLIENTES_CREATE');
    if (!canCreate) {
      return NextResponse.json(
        { error: 'No autorizado para crear clientes.' },
        { status: 401 }
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
      ? rutaIds.map((id: unknown) => Number(id)).filter((id: number) => Number.isFinite(id))
      : [];

    if (normalizedRutaIds.length === 0) {
      return NextResponse.json(
        { error: 'Debe asignar al menos una ruta' },
        { status: 400 }
      );
    }
    if (user.rol !== 'ADMIN') {
      const userRutaIds = Array.isArray(user.rutaIds) ? user.rutaIds : [];
      const invalidRuta = normalizedRutaIds.find((id) => !userRutaIds.includes(id));
      if (invalidRuta) {
        return NextResponse.json(
          { error: 'Solo puedes asignar rutas permitidas para tu usuario.' },
          { status: 400 }
        );
      }
    }

    const nuevoCliente = await prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.create({
        data: {
          nombreCompleto,
          celular,
          direccionNegocio: direccionNegocio || null,
          direccionVivienda: direccionVivienda || null,
          fechaCreacion: new Date(),
        },
      });

      await tx.clienteRuta.createMany({
        data: normalizedRutaIds.map((id: number) => ({ clienteId: cliente.id, rutaId: id })),
        skipDuplicates: true,
      });

      return cliente;
    });

    return NextResponse.json(
      { cliente: nuevoCliente },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating cliente:', error);
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}
