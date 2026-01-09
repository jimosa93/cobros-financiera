'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { cardStyle, headerTitle } from '@/styles/ui';
import SearchBar from '@/components/SearchBar';

interface Cliente {
  id: number;
  nombreCompleto: string;
}

interface Prestamo {
  id: number;
  clienteId?: number;
  cliente?: { nombreCompleto: string };
  montoPrestado?: string;
  tasa?: number;
  cuotas?: number;
  fechaInicio?: string;
  notas?: string;
}

interface Abono {
  id: number;
  fecha: string;
  monto: number;
  tipoPago?: string;
  cobrador?: { nombreCompleto: string };
}

export default function TarjetaVirtualPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCliente = searchParams.get('clienteId') || '';
  const initialPrestamo = searchParams.get('prestamoId') || '';

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState<string>(initialCliente);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [prestamoId, setPrestamoId] = useState<string>(initialPrestamo);
  const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
  const [clienteDetalle, setClienteDetalle] = useState<any>(null);
  const [abonos, setAbonos] = useState<Abono[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // load clients for dropdown
    (async () => {
      try {
        const res = await fetch('/api/clientes?pageSize=1000');
        const data = await res.json();
        setClientes(data.clientes || []);
      } catch (e) {
        setClientes([]);
      }
    })();
  }, []);

  useEffect(() => {
    // when clienteId changes, load prestamos for that client
    if (!clienteId) {
      setPrestamos([]);
      setPrestamoId('');
      return;
    }
    (async () => {
      try {
        const r = await fetch(`/api/prestamos?clienteId=${clienteId}&pageSize=1000`);
        const d = await r.json();
        setPrestamos(d.prestamos || []);
        // if prestamoId is not set, pick first
        if (!prestamoId && d.prestamos?.length) {
          setPrestamoId(String(d.prestamos[0].id));
        }
      } catch {
        setPrestamos([]);
      }
    })();
  }, [clienteId]);

  useEffect(() => {
    // when prestamoId changes, fetch prestamo details and abonos
    const load = async () => {
      setLoading(true);
      try {
        if (prestamoId) {
          const r = await fetch(`/api/prestamos/${prestamoId}`);
          const d = await r.json();
          // API returns { prestamo }
          setPrestamo(d.prestamo || null);
          const ra = await fetch(`/api/abonos?prestamoId=${prestamoId}`);
          const da = await ra.json();
          setAbonos(da.abonos || []);
          // set clienteId to prestamo.clienteId if available
          if (d?.prestamo?.clienteId && !clienteId) setClienteId(String(d.prestamo.clienteId));
          // fetch cliente detalle (direcciones, celular) if prestamo contains clienteId
          const clienteIdFromPrestamo = d?.prestamo?.clienteId;
          if (clienteIdFromPrestamo) {
            try {
              const rc = await fetch(`/api/clientes/${clienteIdFromPrestamo}`);
              const dc = await rc.json();
              setClienteDetalle(dc.cliente || null);
            } catch {
              setClienteDetalle(null);
            }
          } else {
            setClienteDetalle(null);
          }
        } else {
          setPrestamo(null);
          setAbonos([]);
        }
      } catch (e) {
        setPrestamo(null);
        setAbonos([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [prestamoId]);

  // when clienteId changes, fetch cliente detalle as well
  useEffect(() => {
    if (!clienteId) {
      setClienteDetalle(null);
      return;
    }
    (async () => {
      try {
        const rc = await fetch(`/api/clientes/${clienteId}`);
        const dc = await rc.json();
        setClienteDetalle(dc.cliente || null);
      } catch {
        setClienteDetalle(null);
      }
    })();
  }, [clienteId]);

  const handleClienteChange = (id: string) => {
    setClienteId(id);
    setPrestamoId('');
  };

  const handlePrestamoChange = (id: string) => {
    setPrestamoId(id);
    // update URL without reloading
    const params = new URLSearchParams();
    if (clienteId) params.set('clienteId', clienteId);
    if (id) params.set('prestamoId', id);
    router.replace('/tarjeta-virtual?' + params.toString());
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ ...(cardStyle as any), marginBottom: '1rem' }}>
          <h1 style={{ ...headerTitle as any, marginBottom: '0.75rem' }}>Tarjeta virtual</h1>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ flex: '1 1 320px' }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#555', fontWeight: 500 }}>Cliente</label>
              <select value={clienteId} onChange={(e) => handleClienteChange(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ddd' }}>
                <option value=''>Selecciona un cliente...</option>
                {clientes.map(c => <option key={c.id} value={String(c.id)}>{c.nombreCompleto}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#555', fontWeight: 500 }}>Préstamo</label>
              <select value={prestamoId} onChange={(e) => handlePrestamoChange(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ddd' }}>
                <option value=''>Selecciona préstamo...</option>
                {prestamos.map(p => <option key={p.id} value={String(p.id)}>#{p.id} {p.montoPrestado ? `- ${Number(p.montoPrestado).toLocaleString()}` : ''}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'white', padding: 12, borderRadius: 8 }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#222', fontWeight: 700 }}>Información préstamo</h3>
              <p style={{ margin: 0, color: '#222' }}><strong>Monto Prestado:</strong> {prestamo?.montoPrestado ? Number(prestamo.montoPrestado).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : '-'}</p>
              <p style={{ margin: 0, color: '#222' }}><strong>No de Cuotas:</strong> {prestamo?.cuotas ?? '-'}</p>
              {/* valor cuota = totalPagar / cuotas */}
              {prestamo?.montoPrestado && prestamo?.tasa !== undefined && prestamo?.cuotas ? (
                (() => {
                  const montoNum = Number(prestamo.montoPrestado as any);
                  const tasaNum = Number(prestamo.tasa || 0);
                  const totalPagar = montoNum * (1 + tasaNum);
                  const valorCuota = prestamo.cuotas ? totalPagar / prestamo.cuotas : 0;
                  return <p style={{ margin: 0, color: '#222' }}><strong>Valor Cuota:</strong> {valorCuota > 0 ? valorCuota.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : '-'}</p>;
                })()
              ) : <p style={{ margin: 0, color: '#222' }}><strong>Valor Cuota:</strong> -</p>}
              <p style={{ margin: 0, color: '#222' }}><strong>Atrasadas:</strong> -</p>
              <p style={{ margin: 0, color: '#222' }}><strong>Cuota Actual:</strong> { ((): any => {
                if (!prestamo?.montoPrestado || prestamo?.tasa === undefined || !prestamo?.cuotas) return '-';
                const montoNum = Number(prestamo.montoPrestado as any);
                const tasaNum = Number(prestamo.tasa || 0);
                const totalPagar = montoNum * (1 + tasaNum);
                const valorCuota = prestamo.cuotas ? totalPagar / prestamo.cuotas : 0;
                const abonoTotal = abonos.reduce((s, a) => s + Number(a.monto || 0), 0);
                return valorCuota > 0 ? Math.floor(abonoTotal / valorCuota) : '-';
              })() }</p>
              <p style={{ margin: 0, color: '#222' }}><strong>Abono Total:</strong> { abonos.length ? abonos.reduce((s,a)=>s + Number(a.monto || 0),0).toLocaleString('es-CO',{style:'currency',currency:'COP', maximumFractionDigits:0}) : '-' }</p>
              <p style={{ margin: 0, color: '#222' }}><strong>Saldo:</strong> { ((): any => {
                if (!prestamo?.montoPrestado || prestamo?.tasa === undefined) return '-';
                const montoNum = Number(prestamo.montoPrestado as any);
                const tasaNum = Number(prestamo.tasa || 0);
                const totalPagar = montoNum * (1 + tasaNum);
                const abonoTotal = abonos.reduce((s, a) => s + Number(a.monto || 0), 0);
                const saldo = totalPagar - abonoTotal;
                return isNaN(saldo) ? '-' : saldo.toLocaleString('es-CO',{style:'currency',currency:'COP', maximumFractionDigits:0});
              })() }</p>
              {/* notas removed per design */}
            </div>
            <div style={{ background: 'white', padding: 12, borderRadius: 8 }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#222', fontWeight: 700 }}>Información cliente</h3>
              <div style={{ marginTop: 8 }}>
                <p style={{ margin: 0, color: '#222' }}><strong>Dirección vivienda:</strong> {clienteDetalle?.direccionVivienda || '-'}</p>
                <p style={{ margin: 0, color: '#222' }}><strong>Dirección negocio:</strong> {clienteDetalle?.direccionNegocio || '-'}</p>
                <p style={{ margin: 0, color: '#222' }}><strong>Celular:</strong> {clienteDetalle?.celular || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...(cardStyle as any) }}>
          <h2 style={{ marginTop: 0, marginBottom: 12, color: '#222' }}>Abonos</h2>
          {loading ? <div>Cargando...</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#eef2f7' }}>
                  <th style={{ padding: 12, textAlign: 'left', color: '#222', fontWeight: 700 }}>Fecha</th>
                  <th style={{ padding: 12, textAlign: 'left', color: '#222', fontWeight: 700 }}>Monto</th>
                  <th style={{ padding: 12, textAlign: 'left', color: '#222', fontWeight: 700 }}>Tipo</th>
                  <th style={{ padding: 12, textAlign: 'left', color: '#222', fontWeight: 700 }}>Cobrador</th>
                </tr>
              </thead>
              <tbody>
                {abonos.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #e6eef6', background: '#fff', color: '#222' }}>
                    <td style={{ padding: 12, color: '#222' }}>{new Date(a.fecha).toLocaleDateString('es-ES')}</td>
                    <td style={{ padding: 12, color: '#222' }}>{Number(a.monto).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</td>
                    <td style={{ padding: 12, color: '#222' }}>{a.tipoPago || '-'}</td>
                    <td style={{ padding: 12, color: '#222' }}>{a.cobrador?.nombreCompleto || '-'}</td>
                  </tr>
                ))}
                {abonos.length === 0 && <tr><td colSpan={4} style={{ padding: 12, textAlign: 'center', color: '#888' }}>No hay abonos</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

