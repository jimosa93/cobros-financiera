'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import ClienteForm from '@/components/ClienteForm';

export default function EditarClientePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.rol !== 'ADMIN') {
      router.push('/clientes');
    }
  }, [status, session, router]);

  if (status === 'loading') {
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

  if (!session || session.user.rol !== 'ADMIN') {
    return null;
  }

  const clienteId = parseInt(params.id as string);

  if (isNaN(clienteId)) {
    router.push('/clientes');
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Navbar />
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '2rem', color: '#333' }}>Editar Cliente</h1>
        <ClienteForm clienteId={clienteId} />
      </main>
    </div>
  );
}
