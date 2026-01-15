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
    <div className="app-bg">
      <Navbar />
      <main className="app-main">
        <h1 className="page-title">Reportes</h1>
        <p style={{ color: '#666', marginTop: 8, marginBottom: 12 }}>Accede a reportes del sistema. Solo administradores.</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <Link href="/reports/daily">
            <div className="card" style={{ padding: 20, cursor: 'pointer', minWidth: 180 }}>
              <h3 style={{ margin: 0, color: '#222' }}>Resumen Diario</h3>
              <p style={{ margin: '6px 0 0', color: '#666' }}>Totales y abonos por cobrador (hoy)</p>
            </div>
          </Link>
          <Link href="/reports/weekly">
            <div className="card" style={{ padding: 20, cursor: 'pointer', minWidth: 180 }}>
              <h3 style={{ margin: 0, color: '#222' }}>Resumen Semanal</h3>
              <p style={{ margin: '6px 0 0', color: '#666' }}>Totales de la semana (Lun-Dom)</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}

