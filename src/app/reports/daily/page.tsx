'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import Spinner from '@/components/Spinner';

interface CobradorRow { cobradorId: number; nombre: string | null; monto: string; count: number; }

interface CajaTotals {
  entradas: string;
  salidas: string;
  entradasRuta: string;
  salidasRuta: string;
  gastos: string;
}

interface DailyTotals {
  abonosSum: string;
  abonosCount: number;
  prestamosCount: number;
  prestamosSum: string;
  cajaTotals: CajaTotals;
}

interface DailyReport {
  date: string;
  totals: DailyTotals;
  byCobrador: CobradorRow[];
}

export default function ReportsDailyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DailyReport | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.rol !== 'ADMIN') {
      router.replace('/');
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/reports/daily');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [status]);

  if (loading) return <div className="app-bg">
    <Navbar />
    <main className="app-main">
      <div className="spinner-centered"><Spinner size={40} /></div>
    </main>
  </div>;
  if (!data) return <div className="app-bg"><Navbar /><main className="app-main">No hay datos</main></div>;

  // table styles are handled via CSS classes

  return (
    <div className="app-bg">
      <Navbar />
      <main className="app-main">
        <h1 className="page-title">Resumen Diario — {data.date}</h1>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div className="card kpi">
            <div className="muted">Total Abonos</div>
            <div className="value">${Number(data.totals.abonosSum).toLocaleString()}</div>
            <div className="muted">{data.totals.abonosCount} abonos</div>
          </div>
          <div className="card kpi">
            <div className="muted">Total Préstamos</div>
            <div className="value">${Number(data.totals.prestamosSum || 0).toLocaleString()}</div>
            <div className="muted">{data.totals.prestamosCount} préstamos</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div className="card kpi">
            <div className="muted">Total entradas</div>
            <div className="value small">${Number(data.totals.cajaTotals?.entradas || 0).toLocaleString()}</div>
          </div>
          <div className="card kpi">
            <div className="muted">Total salidas</div>
            <div className="value small">${Number(data.totals.cajaTotals?.salidas || 0).toLocaleString()}</div>
          </div>
          <div className="card kpi">
            <div className="muted">Total entradas ruta</div>
            <div className="value small">${Number(data.totals.cajaTotals?.entradasRuta || 0).toLocaleString()}</div>
          </div>
          <div className="card kpi">
            <div className="muted">Total salidas ruta</div>
            <div className="value small">${Number(data.totals.cajaTotals?.salidasRuta || 0).toLocaleString()}</div>
          </div>
          <div className="card kpi">
            <div className="muted">Total gastos</div>
            <div className="value small">${Number(data.totals.cajaTotals?.gastos || 0).toLocaleString()}</div>
          </div>
        </div>

        <h2 className="section-title">Abonos por cobrador</h2>
        <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="table-header">Cobrador</th>
                <th className="table-header" style={{ textAlign: 'right' }}>Monto</th>
                <th className="table-header" style={{ textAlign: 'right' }}>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {(data.byCobrador as CobradorRow[]).map((c) => (
                <tr key={c.cobradorId}>
                  <td className="table-cell">{c.nombre || `#${c.cobradorId}`}</td>
                  <td className="table-cell" style={{ textAlign: 'right' }}>${Number(c.monto).toLocaleString()}</td>
                  <td className="table-cell" style={{ textAlign: 'right' }}>{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

