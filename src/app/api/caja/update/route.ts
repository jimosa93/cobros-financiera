import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const permisoRows = await prisma.usuarioPermiso.findMany({
      where: { usuarioId: user.id },
      select: { permiso: true },
    });
    const permisos = new Set(permisoRows.map((p) => String(p.permiso)));
    const canUpdate = user.rol === 'ADMIN' || permisos.has('CAJA_UPDATE');
    if (!canUpdate) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { id, fecha, tipo, monto, nota, rutaId } = body;
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    const pid = parseInt(String(id), 10);

    const existing = await prisma.caja.findUnique({ where: { id: pid } });
    if (!existing) return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });
    // non-admins may only edit movements for routes they belong to
    if (user.rol !== 'ADMIN') {
      const userRutaIds = Array.isArray(user.rutaIds) ? user.rutaIds : [];
      if (!userRutaIds.includes(existing.rutaId ?? -1)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    }

    const rutaNum = rutaId ? Number(rutaId) : existing.rutaId;
    if (!rutaNum) {
      return NextResponse.json({ error: 'La ruta es requerida' }, { status: 400 });
    }
    if (user.rol !== 'ADMIN') {
      const userRutaIds = Array.isArray(user.rutaIds) ? user.rutaIds : [];
      if (!userRutaIds.includes(rutaNum)) {
        return NextResponse.json({ error: 'Ruta no permitida para tu usuario' }, { status: 401 });
      }
    }

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
          rutaId: rutaNum,
        },
      });
    } else {
      const rows = await (prisma as PrismaClient).$queryRaw`
        UPDATE "Caja"
        SET
          "fecha" = ${fecha ? new Date(fecha) : null}::timestamp,
          "tipo" = ${tipo ? tipo : null}::"MovimientoTipo",
          "monto" = ${monto !== undefined && monto !== null ? String(monto) : null}::numeric,
          "nota" = ${nota || null}::text,
          "rutaId" = ${rutaNum}::integer
        WHERE id = ${pid}
        RETURNING id, fecha, tipo, monto, nota, "rutaId"
      `;
      updated = Array.isArray(rows) && rows[0] ? rows[0] : null;
    }
    return NextResponse.json({ caja: updated });
  } catch (error) {
    console.error('Error updating caja (update route):', error);
    return NextResponse.json({ error: 'Error al actualizar movimiento' }, { status: 500 });
  }
}

