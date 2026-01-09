import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET: List, search, paginate préstamos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || '';

    const clienteIdParam = searchParams.get('clienteId');
    let where: any = {};
    if (clienteIdParam) {
      where = { clienteId: Number(clienteIdParam) };
    } else if (search) {
      where = {
        OR: [
          { notas: { contains: search, mode: 'insensitive' } },
          { cliente: { nombreCompleto: { contains: search, mode: 'insensitive' } } }
        ],
      };
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
    return NextResponse.json({ error: 'Error al listar préstamos' }, { status: 500 });
  }
}

// POST: Crear nuevo préstamo
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const body = await request.json();
    const {
      clienteId, montoPrestado, tasa, cuotas, fechaInicio, notas, cobradorId
    } = body;
    if(!clienteId || !montoPrestado || !tasa || !cuotas || !fechaInicio) {
      return NextResponse.json({ error: 'Campo faltante o inválido en el formulario' }, { status: 400 });
    }
    // Encuentra el máximo orden actual de manera robusta
    const ultimo = await prisma.prestamo.findFirst({ orderBy: { orden: 'desc' } });
    const orden = ultimo ? (ultimo.orden + 1) : 1;
    const prestamo = await prisma.prestamo.create({
      data: {
        clienteId: Number(clienteId),
        montoPrestado: String(montoPrestado), // Decimal en Prisma requiere string
        tasa: parseFloat(tasa),
        cuotas: Number(cuotas),
        fechaInicio: new Date(fechaInicio),
        notas: notas || null,
        cobradorId: Number(cobradorId || user.id),
        orden,
      },
    });
    return NextResponse.json({ prestamo });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
