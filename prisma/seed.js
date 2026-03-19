const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  const adminPassword = await hash('Admin123*', 12);
  const usuarioPassword = await hash('Usuario123*', 12);

  const rutaCentro = await prisma.ruta.create({
    data: {
      nombre: 'Ruta Centro',
      activo: true,
      fechaCreacion: now,
    },
  });

  const rutaNorte = await prisma.ruta.create({
    data: {
      nombre: 'Ruta Norte',
      activo: true,
      fechaCreacion: now,
    },
  });

  const rutaSur = await prisma.ruta.create({
    data: {
      nombre: 'Ruta Sur',
      activo: true,
      fechaCreacion: now,
    },
  });

  const admin = await prisma.usuario.create({
    data: {
      nombreCompleto: 'Administrador General',
      celular: '3000000000',
      email: 'admin@cobros.local',
      alias: 'admin',
      rol: 'ADMIN',
      fechaCreacion: now,
      password: adminPassword,
    },
  });

  await prisma.usuarioPermiso.createMany({
    data: [
      'CLIENTES_READ', 'CLIENTES_CREATE', 'CLIENTES_UPDATE', 'CLIENTES_DELETE',
      'PRESTAMOS_READ', 'PRESTAMOS_CREATE', 'PRESTAMOS_UPDATE', 'PRESTAMOS_DELETE',
      'ABONOS_READ', 'ABONOS_CREATE', 'ABONOS_UPDATE', 'ABONOS_DELETE',
      'CAJA_READ', 'CAJA_CREATE', 'CAJA_UPDATE', 'CAJA_DELETE',
      'RUTAS_READ', 'RUTAS_CREATE', 'RUTAS_UPDATE', 'RUTAS_DELETE',
      'REPORTES_VIEW',
    ].map((permiso) => ({ usuarioId: admin.id, permiso })),
    skipDuplicates: true,
  });

  const usuario = await prisma.usuario.create({
    data: {
      nombreCompleto: 'Usuario de Prueba',
      celular: '3111111111',
      email: 'usuario@cobros.local',
      alias: 'usuario',
      rol: 'USUARIO',
      fechaCreacion: now,
      password: usuarioPassword,
    },
  });

  await prisma.usuarioPermiso.createMany({
    data: [
      'CLIENTES_READ',
      'PRESTAMOS_READ',
      'ABONOS_READ',
      'ABONOS_CREATE',
      'RUTAS_READ',
      'REPORTES_VIEW',
    ].map((permiso) => ({ usuarioId: usuario.id, permiso })),
    skipDuplicates: true,
  });

  await prisma.usuarioRuta.createMany({
    data: [
      { usuarioId: usuario.id, rutaId: rutaCentro.id },
      { usuarioId: usuario.id, rutaId: rutaNorte.id },
    ],
    skipDuplicates: true,
  });

  const cliente = await prisma.cliente.create({
    data: {
      nombreCompleto: 'Cliente Prueba Multi Ruta',
      celular: '3222222222',
      direccionNegocio: 'Calle 1 # 2-3',
      direccionVivienda: 'Cra 4 # 5-6',
      fechaCreacion: now,
    },
  });

  await prisma.clienteRuta.createMany({
    data: [
      { clienteId: cliente.id, rutaId: rutaCentro.id },
      { clienteId: cliente.id, rutaId: rutaSur.id },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completado.');
  console.log('Admin: admin@cobros.local / Admin123*');
  console.log('Usuario: usuario@cobros.local / Usuario123*');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
