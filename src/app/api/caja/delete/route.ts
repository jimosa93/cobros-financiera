import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    const pid = parseInt(String(id), 10);
    const prismaAny = prisma as PrismaClient;
    let deleted;
    if (prismaAny.caja && typeof prismaAny.caja.delete === 'function') {
      deleted = await prisma.caja.delete({ where: { id: pid } });
    } else {
      const rows = await (prisma as PrismaClient).$queryRaw`DELETE FROM "Caja" WHERE id = ${pid} RETURNING id`;
      deleted = Array.isArray(rows) && rows[0] ? rows[0] : null;
    }
    return NextResponse.json({ deleted });
  } catch (error) {
    console.error('Error deleting caja (delete route):', error);
    return NextResponse.json({ error: 'Error al eliminar movimiento' }, { status: 500 });
  }
}

