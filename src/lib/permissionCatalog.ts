export const ALL_PERMISOS = [
  'CLIENTES_READ',
  'CLIENTES_CREATE',
  'CLIENTES_UPDATE',
  'CLIENTES_DELETE',
  'PRESTAMOS_READ',
  'PRESTAMOS_CREATE',
  'PRESTAMOS_UPDATE',
  'PRESTAMOS_DELETE',
  'ABONOS_READ',
  'ABONOS_CREATE',
  'ABONOS_UPDATE',
  'ABONOS_DELETE',
  'CAJA_READ',
  'CAJA_CREATE',
  'CAJA_UPDATE',
  'CAJA_DELETE',
  'RUTAS_READ',
  'RUTAS_CREATE',
  'RUTAS_UPDATE',
  'RUTAS_DELETE',
  'REPORTES_VIEW',
] as const;

export type Permiso = (typeof ALL_PERMISOS)[number];

export const DEFAULT_USUARIO_PERMISOS: Permiso[] = [
  'CLIENTES_READ',
  'PRESTAMOS_READ',
  'ABONOS_READ',
  'ABONOS_CREATE',
];

export const PERMISSION_GROUPS: { label: string; permisos: Permiso[] }[] = [
  { label: 'Clientes', permisos: ['CLIENTES_READ', 'CLIENTES_CREATE', 'CLIENTES_UPDATE', 'CLIENTES_DELETE'] },
  { label: 'Préstamos', permisos: ['PRESTAMOS_READ', 'PRESTAMOS_CREATE', 'PRESTAMOS_UPDATE', 'PRESTAMOS_DELETE'] },
  { label: 'Abonos', permisos: ['ABONOS_READ', 'ABONOS_CREATE', 'ABONOS_UPDATE', 'ABONOS_DELETE'] },
  { label: 'Caja', permisos: ['CAJA_READ', 'CAJA_CREATE', 'CAJA_UPDATE', 'CAJA_DELETE'] },
  { label: 'Rutas', permisos: ['RUTAS_READ', 'RUTAS_CREATE', 'RUTAS_UPDATE', 'RUTAS_DELETE'] },
  { label: 'Reportes', permisos: ['REPORTES_VIEW'] },
];

const PERMISO_LABELS: Record<Permiso, string> = {
  CLIENTES_READ: 'Ver',
  CLIENTES_CREATE: 'Crear',
  CLIENTES_UPDATE: 'Editar',
  CLIENTES_DELETE: 'Eliminar',
  PRESTAMOS_READ: 'Ver',
  PRESTAMOS_CREATE: 'Crear',
  PRESTAMOS_UPDATE: 'Editar',
  PRESTAMOS_DELETE: 'Eliminar',
  ABONOS_READ: 'Ver',
  ABONOS_CREATE: 'Registrar',
  ABONOS_UPDATE: 'Editar',
  ABONOS_DELETE: 'Eliminar',
  CAJA_READ: 'Ver',
  CAJA_CREATE: 'Registrar movimientos',
  CAJA_UPDATE: 'Editar',
  CAJA_DELETE: 'Eliminar',
  RUTAS_READ: 'Ver rutas',
  RUTAS_CREATE: 'Crear ruta',
  RUTAS_UPDATE: 'Editar ruta',
  RUTAS_DELETE: 'Eliminar ruta',
  REPORTES_VIEW: 'Ver reportes',
};

export function getPermisoLabel(permiso: Permiso): string {
  return PERMISO_LABELS[permiso] ?? permiso;
}
