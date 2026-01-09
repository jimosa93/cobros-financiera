import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
        const { nombreCompleto, celular, email, password, alias, rol, placaMoto, fechaTecnico, fechaSoat } = body;

        if (!nombreCompleto || !celular || !email || !password || !rol) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos' },
                { status: 400 }
            );
        }

        const existingUser = await prisma.usuario.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'El email ya está en uso' },
                { status: 400 }
            );
        }

        const hashedPassword = await hash(password, 12);

        const newUser = await prisma.usuario.create({
            data: {
                nombreCompleto,
                celular,
                email,
                password: hashedPassword,
                alias: alias || null,
                rol: rol as 'ADMIN' | 'COBRADOR',
                fechaCreacion: new Date(),
                placaMoto: placaMoto || null,
                fechaTecnico: fechaTecnico ? new Date(fechaTecnico) : null,
                fechaSoat: fechaSoat ? new Date(fechaSoat) : null,
            },
        });

        const { password: _, ...userWithoutPassword } = newUser;

        return NextResponse.json(
            { user: userWithoutPassword },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: 'Error al crear usuario' },
            { status: 500 }
        );
    }
}

// GET: List users (search + pagination)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
        const search = searchParams.get('search') || '';

        const where = search
            ? {
                OR: [
                    { nombreCompleto: { contains: search, mode: Prisma.QueryMode.insensitive } },
                    { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
                    { alias: { contains: search, mode: Prisma.QueryMode.insensitive } },
                ],
            }
            : {};

        const total = await prisma.usuario.count({ where });
        const users = await prisma.usuario.findMany({
            where,
            orderBy: { fechaCreacion: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: {
                id: true,
                nombreCompleto: true,
                celular: true,
                email: true,
                alias: true,
                rol: true,
                fechaCreacion: true,
            },
        });

        return NextResponse.json({ users, total });
    } catch (error) {
        console.error('Error listing users', error);
        return NextResponse.json({ error: 'Error al listar usuarios' }, { status: 500 });
    }
}
