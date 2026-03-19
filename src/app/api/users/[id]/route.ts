import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { Prisma, type Permiso, type Rol } from '@prisma/client';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const idNum = parseInt(id, 10);
    const user = await prisma.usuario.findUnique({
      where: { id: idNum },
      select: {
        id: true,
        nombreCompleto: true,
        celular: true,
        email: true,
        alias: true,
        rol: true,
        fechaCreacion: true,
        placaMoto: true,
        fechaTecnico: true,
        fechaSoat: true,
        permisos: { select: { permiso: true } },
      },
    });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    const rutas = await prisma.usuarioRuta.findMany({
      where: { usuarioId: user.id },
      select: { rutaId: true },
    });
    const { permisos: permRows, ...rest } = user;
    const userWithPermisos = {
      ...rest,
      rutaIds: (rutas ?? []).map((r) => r.rutaId),
      permisos: (permRows ?? []).map((p) => p.permiso),
    };
    return NextResponse.json({ user: userWithPermisos });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentUser();
    if (!current || current.rol !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { id } = await params;
    const idNum = parseInt(id, 10);
    const body = await request.json();
    const { nombreCompleto, celular, email, password, alias, rol, placaMoto, fechaTecnico, fechaSoat, rutaIds, permisos } = body;
    const data: Prisma.UsuarioUpdateInput = {
      nombreCompleto,
      celular,
      email,
      alias: alias || null,
      rol: rol as Rol,
      placaMoto: placaMoto || null,
      fechaTecnico: fechaTecnico ? new Date(fechaTecnico) : null,
      fechaSoat: fechaSoat ? new Date(fechaSoat) : null,
    };
    const normalizedRutaIds = Array.isArray(rutaIds)
      ? rutaIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
      : [];
    if (password) data.password = await hash(password, 12);
    const permisoList = Array.isArray(permisos) ? (permisos as string[]) : [];
    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({ where: { id: idNum }, data });
      await tx.usuarioRuta.deleteMany({ where: { usuarioId: idNum } });
      if (rol === 'USUARIO' && normalizedRutaIds.length > 0) {
        await tx.usuarioRuta.createMany({
          data: normalizedRutaIds.map((id) => ({ usuarioId: idNum, rutaId: id })),
          skipDuplicates: true,
        });
      }
      await tx.usuarioPermiso.deleteMany({ where: { usuarioId: idNum } });
      if (permisoList.length > 0) {
        await tx.usuarioPermiso.createMany({
          data: permisoList.map((p) => ({ usuarioId: idNum, permiso: p as Permiso })),
          skipDuplicates: true,
        });
      }
    });
    const updated = await prisma.usuario.findUnique({
      where: { id: idNum },
      select: {
        id: true,
        nombreCompleto: true,
        celular: true,
        email: true,
        alias: true,
        rol: true,
        fechaCreacion: true,
        placaMoto: true,
        fechaTecnico: true,
        fechaSoat: true,
        permisos: { select: { permiso: true } },
      },
    });
    if (!updated) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    const rutas = await prisma.usuarioRuta.findMany({
      where: { usuarioId: updated.id },
      select: { rutaId: true },
    });
    const { permisos: permRows } = updated;
    const userWithoutPassword = {
      ...updated,
      rutaIds: (rutas ?? []).map((r) => r.rutaId),
      permisos: (permRows ?? []).map((p) => p.permiso),
    };
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentUser();
    if (!current || current.rol !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { id } = await params;
    const idNum = parseInt(id, 10);
    await prisma.usuario.delete({ where: { id: idNum } });
    return NextResponse.json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

