import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hash } from 'bcryptjs';

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
      },
    });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error) {
    console.error(error);
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
    const { nombreCompleto, celular, email, password, alias, rol, placaMoto, fechaTecnico, fechaSoat } = body;
    const data: any = {
      nombreCompleto,
      celular,
      email,
      alias: alias || null,
      rol,
      placaMoto: placaMoto || null,
      fechaTecnico: fechaTecnico ? new Date(fechaTecnico) : null,
      fechaSoat: fechaSoat ? new Date(fechaSoat) : null,
    };
    if (password) data.password = await hash(password, 12);
    const updated = await prisma.usuario.update({ where: { id: idNum }, data });
    const { password: _, ...userWithoutPassword } = updated;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error(error);
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
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

