'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ReportsWeeklyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.rol !== 'ADMIN') {
      router.replace('/');
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/reports/weekly');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [status]);

  if (loading) return <div style={{ padding: 24 }}>Cargando...</div>;
  if (!data) return <div style={{ padding: 24 }}>No hay datos</div>;

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Resumen Semanal — {data.weekStart} a {data.weekEnd}</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#666' }}>Total Abonos</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{Number(data.totals.abonosSum).toLocaleString()}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{data.totals.abonosCount} abonos</div>
        </div>
        <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#666' }}>Préstamos creados</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{data.totals.prestamosCount}</div>
        </div>
      </div>

      <h2 style={{ fontSize: 16 }}>Abonos por día</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8 }}>Día</th>
            <th style={{ textAlign: 'right', padding: 8 }}>Monto</th>
            <th style={{ textAlign: 'right', padding: 8 }}>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.byDay).map(([day, v]: any) => (
            <tr key={day}>
              <td style={{ padding: 8 }}>{day}</td>
              <td style={{ padding: 8, textAlign: 'right' }}>{Number(v.monto).toLocaleString()}</td>
              <td style={{ padding: 8, textAlign: 'right' }}>{v.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: 16 }}>Abonos por cobrador</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8 }}>Cobrador</th>
            <th style={{ textAlign: 'right', padding: 8 }}>Monto</th>
            <th style={{ textAlign: 'right', padding: 8 }}>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {data.byCobrador.map((c: any) => (
            <tr key={c.cobradorId}>
              <td style={{ padding: 8 }}>{c.nombre || `#${c.cobradorId}`}</td>
              <td style={{ padding: 8, textAlign: 'right' }}>{Number(c.monto).toLocaleString()}</td>
              <td style={{ padding: 8, textAlign: 'right' }}>{c.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

