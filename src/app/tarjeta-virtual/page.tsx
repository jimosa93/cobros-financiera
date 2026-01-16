'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { cardStyle, headerTitle } from '@/styles/ui';

interface Cliente {
    id: number;
    nombreCompleto: string;
    direccionNegocio?: string | null;
    direccionVivienda?: string | null;
    celular?: string | null;
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

interface PrestamoList {
    prestamos: Prestamo[];
    cliente?: Cliente;
    clienteId?: number;
}
interface Abono {
    id: number;
    fecha: string;
    monto: number;
    tipoPago?: string;
    cobrador?: { nombreCompleto: string };
}

export default function TarjetaVirtualPage() {
    const router = useRouter();
    const initialCliente = '';
    const initialPrestamo = '';

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [clienteId, setClienteId] = useState<string>(initialCliente);
    const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
    const [prestamoId, setPrestamoId] = useState<string>(initialPrestamo);
    const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
    const [clienteDetalle, setClienteDetalle] = useState<Cliente | null>(null);
    const [abonos, setAbonos] = useState<Abono[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    // helper: count business days excluding Sundays between two dates inclusive
    function businessDaysExcludingSundaysInclusive(start: Date, end: Date): number {
        if (!start || !end) return 0;
        const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        if (e < s) return 0;
        let count = 0;
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
            if (d.getDay() !== 0) count++;
        }
        return count;
    }
    // compute final date by adding `cuotas` calendar days skipping Sundays.
    // The start date does NOT count (i.e. cuotas=1 -> next working day after start, skipping Sundays).
    function addDaysSkippingSundaysExcludingStart(startIso?: string, cuotas?: number): Date | null {
        if (!startIso) return null;
        const d = new Date(startIso);
        if (isNaN(d.getTime())) return null;
        const daysToAdd = Math.max(0, Number(cuotas) || 0);
        let added = 0;
        while (added < daysToAdd) {
            d.setDate(d.getDate() + 1);
            if (d.getDay() !== 0) { // not Sunday
                added++;
            }
        }
        return d;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        // load only clients that have at least one prestamo (active or inactive)
        (async () => {
            try {
                const r = await fetch('/api/prestamos?pageSize=1000');
                const d = await r.json();
                const prestamosList: PrestamoList[] = d.prestamos || [];
                const map = new Map<string, { id: number; nombreCompleto: string }>();
                prestamosList.forEach(p => {
                    if (p.cliente && p.cliente.id) {
                        const idStr = String(p.cliente.id);
                        if (!map.has(idStr)) {
                            map.set(idStr, { id: p.cliente.id, nombreCompleto: p.cliente.nombreCompleto });
                        }
                    } else if (p.clienteId) {
                        const idStr = String(p.clienteId);
                        if (!map.has(idStr)) {
                            // placeholder name until we fetch cliente detail later if needed
                            map.set(idStr, { id: Number(p.clienteId), nombreCompleto: `#${p.clienteId}` });
                        }
                    }
                });
                setClientes(Array.from(map.values()));
            } catch {
                setClientes([]);
            }
        })();
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
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
                // if prestamoId is not set and wasn't provided via URL query, pick first
                if (!prestamoId && !prestamoFromQueryRef.current && d.prestamos?.length) {
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
            } catch {
                setPrestamo(null);
                setAbonos([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [prestamoId, clienteId]);

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

    // read initial query params client-side (avoid useSearchParams to prevent prerender error)
    const prestamoFromQueryRef = useRef(false);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const c = params.get('clienteId') || '';
        const p = params.get('prestamoId') || '';
        if (c) setClienteId(c);
        if (p) { setPrestamoId(p); prestamoFromQueryRef.current = true; }
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <Navbar />
            <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
                <div style={{ ...(cardStyle as React.CSSProperties), marginBottom: '1rem' }}>
                    <h1 style={{ ...(headerTitle as React.CSSProperties), marginBottom: '0.75rem' }}>Tarjeta virtual</h1>
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

                    <div className="tv-grid" style={{ gap: 12, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 420px' }}>
                        <div style={{ background: 'white', padding: 12, borderRadius: 8 }}>
                            <h3 style={{ margin: '0 0 15px 0', color: '#222', fontWeight: 700 }}>Información préstamo</h3>
                            <div
                                className="tv-field-grid"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '170px 1fr',
                                    rowGap: '0.65rem',
                                    columnGap: 12,
                                    alignItems: 'start',
                                }}
                            >
                                <div style={{ color: '#222', fontWeight: 600 }}>Monto Prestado:</div>
                                <div style={{ color: '#222' }}>{prestamo?.montoPrestado ? Number(prestamo.montoPrestado).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '') : '-'}</div>

                                <div style={{ color: '#222', fontWeight: 600 }}>No de Cuotas:</div>
                                <div style={{ color: '#222' }}>{prestamo?.cuotas ?? '-'}</div>

                                <div style={{ color: '#222', fontWeight: 600 }}>Valor Cuota:</div>
                                <div style={{ color: '#222' }}>
                                    {prestamo?.montoPrestado && prestamo?.tasa !== undefined && prestamo?.cuotas
                                        ? (() => {
                                            const montoNum = Number(prestamo.montoPrestado);
                                            const tasaNum = Number(prestamo.tasa || 0);
                                            const totalPagar = montoNum * (1 + tasaNum);
                                            const valorCuota = prestamo.cuotas ? totalPagar / prestamo.cuotas : 0;
                                            return valorCuota > 0 ? valorCuota.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '') : '-';
                                        })()
                                        : '-'
                                    }
                                </div>

                                <div style={{ color: '#222', fontWeight: 600 }}>Fecha Inicial:</div>
                                <div style={{ color: '#222' }}>{prestamo?.fechaInicio ? new Date(prestamo.fechaInicio).toLocaleDateString('es-ES') : '-'}</div>

                                <div style={{ color: '#222', fontWeight: 600 }}>Fecha Final:</div>
                                <div style={{ color: '#222' }}>{prestamo?.fechaInicio ? (addDaysSkippingSundaysExcludingStart(prestamo.fechaInicio, prestamo.cuotas) ? addDaysSkippingSundaysExcludingStart(prestamo.fechaInicio, prestamo.cuotas)!.toLocaleDateString('es-ES') : '-') : '-'}</div>

                                <div style={{ color: '#222', fontWeight: 600 }}>Atrasadas:</div>
                                <div style={{ color: '#222' }}>
                                    {(() => {
                                        if (!prestamo?.montoPrestado || prestamo?.tasa === undefined || !prestamo?.cuotas || !prestamo?.fechaInicio) return '-';
                                        const montoNum = Number(prestamo.montoPrestado);
                                        const tasaNum = Number(prestamo.tasa || 0);
                                        const totalPagar = montoNum * (1 + tasaNum);
                                        const valorCuota = prestamo.cuotas ? totalPagar / prestamo.cuotas : 0;
                                        const abonoTotal = abonos.reduce((s, a) => s + Number(a.monto || 0), 0);
                                        const actualInstallments = valorCuota > 0 ? Math.floor(abonoTotal / valorCuota) : 0;
                                        const startDate = new Date(prestamo.fechaInicio);
                                        const todayLocal = new Date();
                                        const businessDays = businessDaysExcludingSundaysInclusive(startDate, new Date(todayLocal.getFullYear(), todayLocal.getMonth(), todayLocal.getDate()));
                                        const atrasadas = Math.max(0, businessDays - 1 - actualInstallments);
                                        return atrasadas;
                                    })()}
                                </div>

                                <div style={{ color: '#222', fontWeight: 600 }}>Cuota Actual:</div>
                                <div style={{ color: '#222' }}>
                                    {(() => {
                                        if (!prestamo?.montoPrestado || prestamo?.tasa === undefined || !prestamo?.cuotas) return '-';
                                        const montoNum = Number(prestamo.montoPrestado);
                                        const tasaNum = Number(prestamo.tasa || 0);
                                        const totalPagar = montoNum * (1 + tasaNum);
                                        const valorCuota = prestamo.cuotas ? totalPagar / prestamo.cuotas : 0;
                                        const abonoTotal = abonos.reduce((s, a) => s + Number(a.monto || 0), 0);
                                        return valorCuota > 0 ? Math.floor(abonoTotal / valorCuota) : '-';
                                    })()}
                                </div>

                                <div style={{ color: '#222', fontWeight: 600 }}>Abono Total:</div>
                                <div style={{ color: '#222' }}>{abonos.length ? abonos.reduce((s, a) => s + Number(a.monto || 0), 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '') : '-'}</div>

                                <div style={{ color: '#222', fontWeight: 600 }}>Saldo:</div>
                                <div style={{ color: '#222' }}>
                                    {(() => {
                                        if (!prestamo?.montoPrestado || prestamo?.tasa === undefined) return '-';
                                        const montoNum = Number(prestamo.montoPrestado);
                                        const tasaNum = Number(prestamo.tasa || 0);
                                        const totalPagar = montoNum * (1 + tasaNum);
                                        const abonoTotal = abonos.reduce((s, a) => s + Number(a.monto || 0), 0);
                                        const saldo = totalPagar - abonoTotal;
                                        return isNaN(saldo) ? '-' : saldo.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '');
                                    })()}
                                </div>
                            </div>
                        </div>
                        <div style={{ background: 'white', padding: 12, borderRadius: 8 }}>
                            <h3 style={{ margin: '0 0 15px 0', color: '#222', fontWeight: 700 }}>Información cliente</h3>
                            <div
                                className="tv-field-grid"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : '170px 1fr',
                                    rowGap: '0.65rem',
                                    columnGap: 12,
                                    alignItems: 'start',
                                }}
                            >
                                <div style={{ color: '#222', fontWeight: 600 }}>Dirección vivienda:</div>
                                <div style={{ color: '#222' }}>{clienteDetalle?.direccionVivienda || '-'}</div>

                                <div style={{ color: '#222', fontWeight: 600 }}>Dirección negocio:</div>
                                <div style={{ color: '#222' }}>{clienteDetalle?.direccionNegocio || '-'}</div>

                                <div style={{ color: '#222', fontWeight: 600 }}>Celular:</div>
                                <div style={{ color: '#222' }}>{clienteDetalle?.celular || '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ ...(cardStyle as React.CSSProperties) }}>
                    <h2 style={{ marginTop: 0, marginBottom: 12, color: '#222' }}>Abonos</h2>
                    {loading ? <div style={{ textAlign: 'center', padding: 12 }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '6px solid #e5e7eb', borderTop: '6px solid #0070f3', animation: 'spin 1s linear infinite', margin: '0 auto' }} /></div> : (
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table style={{ minWidth: 640, width: '100%', borderCollapse: 'collapse' }}>
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
                                            <td style={{ padding: 12, color: '#222' }}>{Number(a.monto).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '')}</td>
                                            <td style={{ padding: 12, color: '#222' }}>{a.tipoPago || '-'}</td>
                                            <td style={{ padding: 12, color: '#222' }}>{a.cobrador?.nombreCompleto || '-'}</td>
                                        </tr>
                                    ))}
                                    {abonos.length === 0 && <tr><td colSpan={4} style={{ padding: 12, textAlign: 'center', color: '#888' }}>No hay abonos</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

