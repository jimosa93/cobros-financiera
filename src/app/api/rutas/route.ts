import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const rutas = await prisma.ruta.findMany({
      where: includeInactive ? {} : { activo: true },
      orderBy: { fechaCreacion: 'desc' },
      include: {
        _count: {
          select: {
            clientes: true,
            prestamos: true,
            usuarios: true,
          },
        },
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
    const user = await getCurrentUser();
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
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
