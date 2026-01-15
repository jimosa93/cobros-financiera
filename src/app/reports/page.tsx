'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';

export default function ReportsIndex() {
  const { data: session, status } = useSession();
  const router = useRouter();
  if (status === 'loading') return null;
  if (!session || session.user?.rol !== 'ADMIN') {
    router.replace('/');
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Reportes</h1>
        <p style={{ color: '#666' }}>Accede a reportes del sistema. Solo administradores.</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <Link href="/reports/daily">
            <div style={{ padding: 20, border: '1px solid #e6e6e6', borderRadius: 8, cursor: 'pointer', minWidth: 180 }}>
              <h3 style={{ margin: 0 }}>Resumen Diario</h3>
              <p style={{ margin: '6px 0 0', color: '#666' }}>Totales y abonos por cobrador (hoy)</p>
            </div>
          </Link>
          <Link href="/reports/weekly">
            <div style={{ padding: 20, border: '1px solid #e6e6e6', borderRadius: 8, cursor: 'pointer', minWidth: 180 }}>
              <h3 style={{ margin: 0 }}>Resumen Semanal</h3>
              <p style={{ margin: '6px 0 0', color: '#666' }}>Totales de la semana (Lun-Dom)</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}

