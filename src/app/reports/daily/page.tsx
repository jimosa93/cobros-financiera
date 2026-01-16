'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import Spinner from '@/components/Spinner';

interface CobradorRow { cobradorId: number; nombre: string | null; monto: string; count: number; }

interface AbonoConsignacion {
  id: number;
  fecha: string;
  prestamoId: number;
  monto: string;
  tipoPago: string;
  prestamo?: { cliente?: { nombreCompleto?: string } };
  cobrador?: { nombreCompleto?: string };
}

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
        const now = new Date();
        const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const res = await fetch(`/api/reports/daily?date=${localDate}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, router, session]);

  // consignaciones (con-supervisor / con-jefe) for the day
  const [consignaciones, setConsignaciones] = useState<AbonoConsignacion[]>([]);
  const [consignacionesSum, setConsignacionesSum] = useState<string>("0");
  useEffect(() => {
    if (!data) return;
    (async () => {
      try {
        // build explicit start/end ISO instants for the local day and send to API
        const [y, m, d] = (data.date || '').split('-').map(Number);
        const startLocal = new Date(y, m - 1, d, 0, 0, 0, 0);
        const endLocal = new Date(startLocal.getTime() + 24 * 60 * 60 * 1000);
        const params = new URLSearchParams();
        params.set('start', startLocal.toISOString());
        params.set('end', endLocal.toISOString());
        params.append('tipoPago', 'CON-SUPERVISOR');
        params.append('tipoPago', 'CON-JEFE');
        params.set('pageSize', '1000');
        const res = await fetch(`/api/abonos?${params.toString()}`);
        const j = await res.json();
        setConsignaciones(j.abonos || []);
        setConsignacionesSum(j.sumMonto ?? "0");
      } catch {
        setConsignaciones([]);
      }
    })();
  }, [data]);

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
        <div style={{ marginBottom: 12 }}>
          <Link href="/reports" aria-label="Volver a Reportes" style={{ color: '#0070f3', textDecoration: 'none' }}>← Atrás</Link>
        </div>
        <h1 className="page-title">Resumen Diario — {new Date(data.date + 'T00:00:00').toLocaleDateString('es-ES')}</h1>
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
        <h2 className="section-title" style={{ marginTop: 20 }}>Informe consignaciones</h2>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div className="card kpi">
            <div className="muted">Total consignaciones</div>
            <div className="value small">${Number(consignacionesSum || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="table-header">Fecha</th>
                <th className="table-header">Cliente</th>
                <th className="table-header">Id préstamo</th>
                <th className="table-header">Monto</th>
                <th className="table-header">Tipo de pago</th>
                <th className="table-header">Cobrador</th>
              </tr>
            </thead>
            <tbody>
              {consignaciones.length === 0 && <tr><td colSpan={6} className="table-cell" style={{ textAlign: 'center' }}>No hay consignaciones</td></tr>}
              {consignaciones.map((c) => (
                <tr key={c.id}>
                  <td className="table-cell">{new Date(c.fecha).toLocaleDateString("es-ES")}</td>
                  <td className="table-cell">{c.prestamo?.cliente?.nombreCompleto || '-'}</td>
                  <td className="table-cell">#{c.prestamoId}</td>
                  <td className="table-cell">${Number(c.monto).toLocaleString()}</td>
                  <td className="table-cell">{c.tipoPago}</td>
                  <td className="table-cell">{c.cobrador?.nombreCompleto || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

