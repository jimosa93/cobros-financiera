import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { Prisma } from '@prisma/client';

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
        rutaId: true,
        permisos: { select: { permiso: true } },
      },
    });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    const { permisos: permRows, ...rest } = user;
    const userWithPermisos = { ...rest, permisos: (permRows ?? []).map((p) => p.permiso) };
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
    const { nombreCompleto, celular, email, password, alias, rol, placaMoto, fechaTecnico, fechaSoat, rutaId, permisos } = body;
    const data: Prisma.UsuarioUpdateInput = {
      nombreCompleto,
      celular,
      email,
      alias: alias || null,
      rol: rol as 'ADMIN' | 'USUARIO',
      placaMoto: placaMoto || null,
      fechaTecnico: fechaTecnico ? new Date(fechaTecnico) : null,
      fechaSoat: fechaSoat ? new Date(fechaSoat) : null,
    };
    if (rol === 'USUARIO' && rutaId) {
      data.ruta = { connect: { id: parseInt(rutaId) } };
    } else if (rol === 'ADMIN') {
      data.ruta = { disconnect: true };
    }
    if (password) data.password = await hash(password, 12);
    const permisoList = Array.isArray(permisos) ? permisos as string[] : [];
    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({ where: { id: idNum }, data });
      await tx.usuarioPermiso.deleteMany({ where: { usuarioId: idNum } });
      if (permisoList.length > 0) {
        await tx.usuarioPermiso.createMany({
          data: permisoList.map((p) => ({ usuarioId: idNum, permiso: p })),
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
        rutaId: true,
        permisos: { select: { permiso: true } },
      },
    });
    if (!updated) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    const { permisos: permRows } = updated;
    const userWithoutPassword = { ...updated, permisos: (permRows ?? []).map((p) => p.permiso) };
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

