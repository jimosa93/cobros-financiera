'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import Spinner from '@/components/Spinner';
import Link from 'next/link';

interface Row {
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

export default function ReportsCajaPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // request a historical range (last 30 days including today) by sending explicit start/end ISO instants
        const now = new Date();
        const DAYS = 30;
        const startLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (DAYS - 1), 0, 0, 0, 0); // 29 days before today
        const endLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0); // exclusive next day
        const params = new URLSearchParams();
        params.set('start', startLocal.toISOString());
        params.set('end', endLocal.toISOString());
        const res = await fetch(`/api/reports/caja?${params.toString()}`);
        const j = await res.json();
        setRows(j.rows || []);
      } catch (e) {
        console.error(e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="app-bg">
      <Navbar />
      <main className="app-main">
        <div style={{ marginBottom: 12 }}>
          <Link href="/reports" style={{ color: '#0070f3', textDecoration: 'none' }}>← Atrás</Link>
        </div>
        <h1 className="page-title">Informe Caja</h1>
        <div className="table-wrap" style={{ marginBottom: 12 }}>
          {loading ? <div className="spinner-centered"><Spinner size={40} /></div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr>
                  <th className="table-header">Fecha</th>
                  <th className="table-header">Prestado</th>
                  <th className="table-header">Cobrado</th>
                  <th className="table-header">Entradas</th>
                  <th className="table-header">Salidas</th>
                  <th className="table-header">Gastos</th>
                  <th className="table-header">Entradas Ruta</th>
                  <th className="table-header">Salidas Ruta</th>
                  <th className="table-header">Cuentas día</th>
                  <th className="table-header">Caja fin del día</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={10} className="table-cell" style={{ textAlign: 'center' }}>No hay datos</td></tr>}
                {rows.map(r => (
                  <tr key={r.fecha}>
                    <td className="table-cell">{new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-ES')}</td>
                    {/* {Number(a.monto).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })} */}
                    <td className="table-cell">${Number(r.prestado).toLocaleString()}</td>
                    <td className="table-cell">${Number(r.cobrado).toLocaleString()}</td>
                    <td className="table-cell">${Number(r.entradas).toLocaleString()}</td>
                    <td className="table-cell">${Number(r.salidas).toLocaleString()}</td>
                    <td className="table-cell">${Number(r.gastos).toLocaleString()}</td>
                    <td className="table-cell">${Number(r.entradasRuta).toLocaleString()}</td>
                    <td className="table-cell">${Number(r.salidasRuta).toLocaleString()}</td>
                    <td className="table-cell">{Number(r.cuentasDia).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '')}</td>
                    <td className="table-cell">{Number(r.cajaFin).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

