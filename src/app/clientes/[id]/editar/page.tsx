'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import ClienteForm from '@/components/ClienteForm';
import Spinner from '@/components/Spinner';

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
    return <div style={{ overflowX: 'auto', background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '1.6rem 1.1rem', height: '100vh' }}>
      <Spinner size={40} />
    </div>;
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
