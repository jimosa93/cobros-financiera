import { NextResponse } from 'next/server';
import { PERMISSION_GROUPS, getPermisoLabel } from '@/lib/permissionCatalog';

export async function GET() {
  const groups = PERMISSION_GROUPS.map((g) => ({
    label: g.label,
    permisos: g.permisos.map((p) => ({ value: p, label: getPermisoLabel(p) })),
  }));
  return NextResponse.json({ groups });
}
