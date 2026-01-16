'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';

interface CajaToday {
  fecha: string;
  prestado: number;
  cobrado: number;
  entradas: number;
  salidas: number;
  gastos: number;
  entradasRuta: number;
  salidasRuta: number;
  cuentasDia: number;
  cajaFin: number;
}

export default function ReportsIndex() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [today, setToday] = useState<CajaToday | null>(null);
  const [prevCajaFin, setPrevCajaFin] = useState<number>(0);
  useEffect(() => {
    (async () => {
      try {
        const now = new Date();
        const startLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endLocal = new Date(startLocal.getTime() + 24 * 60 * 60 * 1000);
        const res = await fetch(`/api/reports/caja?start=${encodeURIComponent(startLocal.toISOString())}&end=${encodeURIComponent(endLocal.toISOString())}`);
        const j = await res.json();
        // console.log('j caja', j);
        const rows: CajaToday[] = j.rows || [];
        const idx = rows.findIndex(r => r.fecha === startLocal.toISOString().substring(0, 10));
        const todayRow = idx >= 0 ? rows[idx] : (rows.length > 0 ? rows[0] : null);
        setToday(todayRow);

        if (todayRow) {
          // If server returned previous day row, use it; otherwise derive previous cajaFin from today's row
          if (idx >= 0 && idx + 1 < rows.length) {
            setPrevCajaFin(Number(rows[idx + 1].cajaFin || 0));
          } else if (rows.length > 1) {
            setPrevCajaFin(Number(rows[1].cajaFin || 0));
          } else {
            // single-row case: prevCajaFin = today.cajaFin - today.cuentasDia
            setPrevCajaFin(Number((todayRow.cajaFin || 0) - (todayRow.cuentasDia || 0)));
          }
        } else {
          setPrevCajaFin(0);
        }
      } catch {
        setToday(null);
      }
    })();
  }, []);

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
        <div className="dashboard-grid">
          <Link href="/reports/daily">
            <div className="dashboard-card">
              <div className="icon" style={{ backgroundColor: '#0ea5a0' }}>D</div>
              <h3 style={{ margin: 0, color: '#222' }}>Resumen Diario</h3>
              <p style={{ margin: '6px 0 0', color: '#666' }}>Totales y abonos por cobrador (hoy)</p>
            </div>
          </Link>
          <Link href="/reports/weekly">
            <div className="dashboard-card">
              <div className="icon" style={{ backgroundColor: '#0ea5a0' }}>S</div>
              <h3 style={{ margin: 0, color: '#222' }}>Resumen Semanal</h3>
              <p style={{ margin: '6px 0 0', color: '#666' }}>Totales de la semana (Lun-Dom)</p>
            </div>
          </Link>
          <Link href="/reports/caja">
            <div className="dashboard-card">
              <div className="icon" style={{ backgroundColor: '#0ea5a0' }}>C</div>
              <h3 style={{ margin: 0, color: '#222' }}>Informe Caja General</h3>
              <p style={{ margin: '6px 0 0', color: '#666' }}>Resumen histórico de caja</p>
            </div>
          </Link>
        </div>
        {/* Today's caja quick view */}
        <div style={{ marginTop: 20, marginBottom: 12 }}>
          <h2 className="section-title">Informe Caja — Hoy</h2>
          <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            <div>
              <div className="muted">Fecha</div>
              <div className="value">{today ? new Date(today.fecha + 'T00:00:00').toLocaleDateString('es-ES') : "-"}</div>
            </div>
            <div>
              <div className="muted">Caja Inicial</div>
              <div className="value">{prevCajaFin ? Number(prevCajaFin).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '') : '0'}</div>
            </div>
            <div>
              <div className="muted">Prestado</div>
              <div className="value">${today ? Number(today.prestado).toLocaleString() : '0'}</div>
            </div>
            <div>
              <div className="muted">Cobrado</div>
              <div className="value">${today ? Number(today.cobrado).toLocaleString() : '0'}</div>
            </div>
            <div>
              <div className="muted">Entradas</div>
              <div className="value">${today ? Number(today.entradas).toLocaleString() : '0'}</div>
            </div>
            <div>
              <div className="muted">Salidas</div>
              <div className="value">${today ? Number(today.salidas).toLocaleString() : '0'}</div>
            </div>
            <div>
              <div className="muted">Gastos</div>
              <div className="value">${today ? Number(today.gastos).toLocaleString() : '0'}</div>
            </div>
            <div>
              <div className="muted">Entradas Ruta</div>
              <div className="value">${today ? Number(today.entradasRuta).toLocaleString() : '0'}</div>
            </div>
            <div>
              <div className="muted">Salidas Ruta</div>
              <div className="value">${today ? Number(today.salidasRuta).toLocaleString() : '0'}</div>
            </div>
            <div>
              <div className="muted">Cuentas día</div>
              <div className="value">{today ? Number(today.cuentasDia).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '') : '0'}</div>
            </div>
            <div>
              <div className="muted">Caja fin del día</div>
              <div className="value">{today ? Number(today.cajaFin).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '') : '0'}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

