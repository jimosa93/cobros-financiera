import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getCurrentUser } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { Prisma, type Rol, type Permiso } from '@prisma/client';
import { DEFAULT_USUARIO_PERMISOS } from '@/lib/permissionCatalog';

async function getAdminUser(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.sub) return null;
    const user = await prisma.usuario.findUnique({
        where: { id: parseInt(token.sub, 10) },
        select: {
            id: true,
            nombreCompleto: true,
            email: true,
            rol: true,
            alias: true,
        },
    });
    return user ?? null;
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
        const { nombreCompleto, celular, email, password, alias, rol, placaMoto, fechaTecnico, fechaSoat, permisos, rutaIds } = body;

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

        const permisoList = Array.isArray(permisos) ? permisos as string[] : (rol === 'USUARIO' ? DEFAULT_USUARIO_PERMISOS : []);

        const normalizedRutaIds = Array.isArray(rutaIds)
            ? rutaIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
            : [];

        const newUser = await prisma.$transaction(async (tx) => {
            const u = await tx.usuario.create({
                data: {
                    nombreCompleto,
                    celular,
                    email,
                    password: hashedPassword,
                    alias: alias || null,
                    // Cast to Prisma enum types (runtime values come from persisted DB / form)
                    rol: rol as Rol,
                    fechaCreacion: new Date(),
                    placaMoto: placaMoto || null,
                    fechaTecnico: fechaTecnico ? new Date(fechaTecnico) : null,
                    fechaSoat: fechaSoat ? new Date(fechaSoat) : null,
                },
            });
            if (rol === 'USUARIO' && normalizedRutaIds.length > 0) {
                await tx.usuarioRuta.createMany({
                    data: normalizedRutaIds.map((id) => ({ usuarioId: u.id, rutaId: id })),
                    skipDuplicates: true,
                });
            }
            if (permisoList.length > 0) {
                await tx.usuarioPermiso.createMany({
                    data: permisoList.map((p) => ({ usuarioId: u.id, permiso: p as Permiso })),
                    skipDuplicates: true,
                });
            }
            return u;
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// GET: List users (search + pagination) — ADMIN only
export async function GET(request: NextRequest) {
    try {
        const user = await getAdminUser(request);
        if (!user || user.rol !== 'ADMIN') {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

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
        const message = error instanceof Error ? error.message : 'Unknown error';
        const stack = error instanceof Error ? error.stack : undefined;
        console.error('Error listing users:', message, stack);
        const isDev = process.env.NODE_ENV === 'development';
        return NextResponse.json(
            { error: isDev ? message : 'Error al listar usuarios' },
            { status: 500 }
        );
    }
}
