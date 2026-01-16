import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, fecha, tipo, monto, nota } = body;
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    const pid = parseInt(String(id), 10);
    const prismaAny = prisma as PrismaClient;
    let updated;
    if (prismaAny.caja && typeof prismaAny.caja.update === 'function') {
      updated = await prisma.caja.update({
        where: { id: pid },
        data: {
          fecha: fecha ? new Date(fecha) : undefined,
          tipo: tipo || undefined,
          monto: monto !== undefined && monto !== null ? String(monto) : undefined,
          nota: nota || undefined,
        },
      });
    } else {
      // Use parameterized query to avoid SQL syntax issues and injection
      const rows = await (prisma as PrismaClient).$queryRaw`
        UPDATE "Caja"
        SET
          "fecha" = ${fecha ? new Date(fecha) : null}::timestamp,
          "tipo" = ${tipo ? tipo : null}::"MovimientoTipo",
          "monto" = ${monto !== undefined && monto !== null ? String(monto) : null}::numeric,
          "nota" = ${nota || null}::text
        WHERE id = ${pid}
        RETURNING id, fecha, tipo, monto, nota
      `;
      updated = Array.isArray(rows) && rows[0] ? rows[0] : null;
    }
    return NextResponse.json({ caja: updated });
  } catch (error) {
    console.error('Error updating caja (update route):', error);
    return NextResponse.json({ error: 'Error al actualizar movimiento' }, { status: 500 });
  }
}

