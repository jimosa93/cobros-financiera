'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import ClienteForm from '@/components/ClienteForm';
import { usePermissions } from '@/contexts/PermissionsContext';

export default function NuevoClientePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { can, loading: loadingPerms } = usePermissions();

  useEffect(() => {
    if (status === 'loading' || loadingPerms) return;
    if (!session) {
      router.push('/login');
    } else if (!can('CLIENTES_CREATE')) {
      router.push('/clientes');
    }
  }, [status, loadingPerms, session, can, router]);

  if (status === 'loading' || loadingPerms) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Cargando...
      </div>
    );
  }

  if (!session || !can('CLIENTES_CREATE')) {
    return null;
  }

  return (
    <div className="app-bg">
      <Navbar />
      <main className="app-main">
        <h1 className="page-title">Nuevo Cliente</h1>
        <ClienteForm />
      </main>
    </div>
  );
}
