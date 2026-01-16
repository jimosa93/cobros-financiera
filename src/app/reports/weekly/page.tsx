'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import Spinner from '@/components/Spinner';

interface CajaTotals {
  entradas: string;
  salidas: string;
  entradasRuta: string;
  salidasRuta: string;
  gastos: string;
}

interface WeeklyTotals {
  abonosSum: string;
  abonosCount: number;
  prestamosCount: number;
  prestamosSum: string;
  cajaTotals: CajaTotals;
}

interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totals: WeeklyTotals;
  byCobrador: Array<{ cobradorId: number; nombre: string | null; monto: string; count: number }>;
  byDay: Record<string, { monto: number; count: number }>;
}

export default function ReportsWeeklyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WeeklyReport | null>(null);

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
        const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Monday
        const startLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
        const endLocal = new Date(startLocal.getTime() + 6 * 24 * 60 * 60 * 1000); // next Monday exclusive
        const params = new URLSearchParams();
        params.set('start', startLocal.toISOString());
        params.set('end', endLocal.toISOString());
        const res = await fetch(`/api/reports/weekly?${params.toString()}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, router, session]);

  // consignaciones for the week
  interface AbonoConsignacion {
    id: number;
    fecha: string;
    prestamoId: number;
    monto: string;
    tipoPago: string;
    prestamo?: { cliente?: { nombreCompleto?: string } };
    cobrador?: { nombreCompleto?: string };
  }
  const [consignaciones, setConsignaciones] = useState<AbonoConsignacion[]>([]);
  const [consignacionesSum, setConsignacionesSum] = useState<string>("0");
  useEffect(() => {
    if (!data) return;
    (async () => {
      try {
        // build ISO range from local weekStart 00:00 to day after weekEnd 00:00 (exclusive)
        // Use date-only params for week range; API will treat fecha_to as inclusive day
        // build explicit start/end ISO for the week (local)
        const [ys, ms, ds] = (data.weekStart || '').split('-').map(Number);
        const [ye, me, de] = (data.weekEnd || '').split('-').map(Number);
        const startLocal = new Date(ys, ms - 1, ds, 0, 0, 0, 0);
        const endLocal = new Date(ye, me - 1, de, 0, 0, 0, 0);
        // make end exclusive by adding one day
        endLocal.setDate(endLocal.getDate() + 1);
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

  if (loading) return <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
    <Navbar />
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem' }}>
      <Spinner size={40} />
    </main>
  </div>;
  if (!data) return <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '2rem' }}>No hay datos</div>;

  // table styles handled via CSS classes

  function getISOWeekNumber(d: Date) {
    // ISO week date weeks start on Monday, week 1 is the week with the first Thursday of the year.
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
    // Set to nearest Thursday: current date + 4 - current day number
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  }

  const weekNumber = (() => {
    try {
      const startDate = data?.weekStart ? new Date(data.weekStart) : new Date();
      return getISOWeekNumber(startDate);
    } catch {
      return null;
    }
  })();

  return (
    <div className="app-bg">
      <Navbar />
      <main className="app-main">
        <div style={{ marginBottom: 12 }}>
          <Link href="/reports" aria-label="Volver a Reportes" style={{ color: '#0070f3', textDecoration: 'none' }}>← Atrás</Link>
        </div>
        <h1 className="page-title">
          Resumen Semanal — {new Date(data.weekStart + 'T00:00:00').toLocaleDateString('es-ES')} a {new Date(data.weekEnd + 'T00:00:00').toLocaleDateString('es-ES')}{weekNumber ? ` (Semana ${weekNumber})` : ''}
        </h1>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
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

        <h2 style={{ fontSize: 16, color: '#222' }}>Abonos por día</h2>
        <div className="table-wrap" style={{ marginBottom: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="table-header">Día</th>
                <th className="table-header" style={{ textAlign: 'right' }}>Monto</th>
                <th className="table-header" style={{ textAlign: 'right' }}>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.byDay as Record<string, { monto: number; count: number }>).map(([day, v]) => (
                <tr key={day}>
                  <td className="table-cell">{new Date(day).toLocaleDateString("es-ES", { timeZone: "UTC" })}</td>
                  <td className="table-cell" style={{ textAlign: 'right' }}>${Number(v.monto).toLocaleString()}</td>
                  <td className="table-cell" style={{ textAlign: 'right' }}>{v.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 style={{ fontSize: 16, color: '#222' }}>Abonos por cobrador</h2>
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
              {(data.byCobrador as Array<{ cobradorId: number; nombre: string | null; monto: string; count: number }>).map((c) => (
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
                  <td className="table-cell">{Number(c.monto).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '')}</td>
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

