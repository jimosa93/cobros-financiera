 "use client";

import React from 'react';

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { searchBlock, inputStyle, primaryButton } from '@/styles/ui';
import SearchBar from '@/components/SearchBar';
import { IconButton, Pagination } from '@/components/TableControls';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import { useSession } from 'next-auth/react';

interface Prestamo {
  id: number;
  cliente: { nombreCompleto: string };
  montoPrestado: string;
  tasa: number;
  cuotas: number;
  notas?: string;
  orden: number;
}

function RowSortable({ p, idx, children }: { p: Prestamo, idx: number; children: React.ReactNode }) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: p.id});
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    background: idx%2 ? '#fff':'#fafafd',
    height: 45,
    cursor: 'default',
    boxShadow: isDragging ? '0 2px 8px #3a8dde22' : 'none'
  };

  // Attach drag listeners only to the first child (the handle cell)
  const childrenArray = React.Children.toArray(children);
  const first = childrenArray[0];
  const rest = childrenArray.slice(1);
  const firstWithHandle = React.isValidElement(first)
    ? React.cloneElement(first as React.ReactElement, {
        ...attributes,
        ...listeners,
        style: { ...(first as any).props.style, cursor: 'grab' },
      })
    : first;

  return (
    <tr ref={setNodeRef} style={style}>
      {firstWithHandle}
      {rest}
    </tr>
  );
}

export default function PrestamosPage() {
  const { data: session, status } = useSession();
  const isAdmin = !!session && session.user?.rol === 'ADMIN';

  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [abonoSums, setAbonoSums] = useState<Record<number, number>>({});
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [moving, setMoving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    setLoading(true);
    (async () => {
      const res = await fetch(`/api/prestamos?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(query)}`);
      const data = await res.json();
      const items: Prestamo[] = data.prestamos || [];
      setPrestamos(items);
      setTotal(data.total || 0);

      // fetch abono sums for each prestamo
      try {
        const sums = await Promise.all(items.map(async (p) => {
          try {
            const r = await fetch(`/api/abonos?prestamoId=${p.id}`);
            const d = await r.json();
            return { id: p.id, sum: d.sumMonto ? Number(d.sumMonto) : 0 };
          } catch {
            return { id: p.id, sum: 0 };
          }
        }));
        const map: Record<number, number> = {};
        sums.forEach(s => { map[s.id] = s.sum; });
        setAbonoSums(map);
      } catch {
        setAbonoSums({});
      } finally {
        setLoading(false);
      }
    })();
  }, [page, pageSize, query, moving]);

  const calculate = (monto: string, tasa: number, cuotas: number) => {
    const montoNum = parseFloat(monto);
    const totalPagar = montoNum * (1 + tasa);
    const valorCuota = cuotas > 0 ? totalPagar / cuotas : 0;
    return { totalPagar, valorCuota };
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setMoving(true);
    await fetch(`/api/prestamos/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toOrden: prestamos.find(p => p.id === Number(over.id))?.orden })
    });
    setMoving(false);
    // Mover local
    setPrestamos(prev => {
      const old = prev.findIndex(p => p.id === Number(active.id));
      const newI = prev.findIndex(p => p.id === Number(over.id));
      return arrayMove(prev, old, newI);
    });
  };

  async function eliminarPrestamo(id: number) {
    if(!confirm('¿Eliminar este préstamo de forma permanente?')) return;
    setMoving(true);
    const res = await fetch(`/api/prestamos/${id}`,{ method:'DELETE' });
    const info = await res.json();
    setMoving(false);
    if (!res.ok) alert(info.error || 'No se pudo eliminar');
    else setPrestamos(prev => prev.filter(p => p.id !== id));
  }

  const headerStyle = { textAlign:'left', fontWeight:600, color:'#232323', fontSize:16, background:'#f9fafe', padding:'13px 8px' };
  const cellStyle = { color:'#232323', fontSize:15, background:'#fff', padding:'12px 8px', borderBottom:'1px solid #ecedef', fontWeight:400 };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontWeight: 700, fontSize: '2rem', color: '#222' }}>
          Préstamos
        </h1>
        <SearchBar
          value={query}
          onChange={(v) => { setQuery(v); setPage(1); }}
          placeholder="Buscar por cliente o nota..."
          addHref="/prestamos/nuevo"
          addLabel="+ Nuevo Préstamo"
          showAdd={isAdmin}
        />
        <div style={{overflowX:'auto', background:'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding:'1.6rem 1.1rem'}}>
        {loading ? (
          <div style={{textAlign:'center'}}>Cargando...</div>
        ) : (
          <>
            {isAdmin ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={prestamos.map(p=>p.id)} strategy={verticalListSortingStrategy}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:15}}>
                    <thead>
                    <tr>
                        <th style={headerStyle}>#</th>
                        <th style={headerStyle}>Id</th>
                        <th style={headerStyle}>Cliente</th>
                        <th style={headerStyle}>Monto</th>
                        <th style={headerStyle}>Cuotas</th>
                        <th style={headerStyle}>Interés</th>
                        <th style={headerStyle}>Valor Cuota</th>
                        <th style={headerStyle}>Total</th>
                        <th style={headerStyle}>Abono T</th>
                        <th style={headerStyle}>Saldo</th>
                        <th style={headerStyle}>Fecha I</th>
                        <th style={headerStyle}>Actual</th>
                        <th style={headerStyle}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prestamos.length === 0 && (
                        <tr><td colSpan={9} style={{textAlign:'center',padding:'2rem 0',color:'#888'}}>No hay préstamos</td></tr>
                      )}
                      {prestamos.map((p, idx) => {
                        const { valorCuota, totalPagar } = calculate(p.montoPrestado, p.tasa, p.cuotas);
                        return (
                          <RowSortable p={p} idx={idx} key={p.id}>
                            <td style={{...cellStyle, cursor:'grab', fontWeight:500}}>::</td>
                            <td style={cellStyle}>{p.id}</td>
                            <td style={cellStyle}>{p.cliente.nombreCompleto}</td>
                            <td style={cellStyle}>{Number(p.montoPrestado).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</td>
                            <td style={cellStyle}>{p.cuotas}</td>
                            <td style={cellStyle}>{Math.round(p.tasa*100)}%</td>
                            <td style={cellStyle}>{valorCuota>0 ? valorCuota.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : ''}</td>
                            <td style={cellStyle}>{totalPagar>0 ? totalPagar.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : ''}</td>
                            <td style={cellStyle}>{(abonoSums[p.id] || 0) > 0 ? (abonoSums[p.id] || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : '-'}</td>
                            <td style={cellStyle}>{ (totalPagar - (abonoSums[p.id] || 0)) >= 0 ? (totalPagar - (abonoSums[p.id] || 0)).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : '-' }</td>
                            <td style={cellStyle}>{(p as any).fechaInicio ? (p as any).fechaInicio.substr(0,10) : '-'}</td>
                            <td style={cellStyle}>{valorCuota > 0 ? Math.floor((abonoSums[p.id] || 0) / valorCuota) : 0}</td>
                            <td style={{...cellStyle, background:'none', display:'flex', gap:8, justifyContent:'center', alignItems:'center'}}>
                              <button aria-label="Editar" title="Editar" onClick={()=>window.location.href=`/prestamos/${p.id}/editar`} style={{ padding:8, border:'1px solid #bbb', background:'white', borderRadius:6, cursor:'pointer' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="#0070f3" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="#0070f3" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </button>
                              <button aria-label="Eliminar" title="Eliminar" onClick={()=>eliminarPrestamo(p.id)} style={{ padding:8, border:'1px solid #e57373', background:'#e57373', borderRadius:6, cursor:'pointer' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11v6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </button>
                            </td>
                          </RowSortable>
                        );
                      })}
                    </tbody>
                  </table>
                </SortableContext>
              </DndContext>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:15}}>
                <thead>
                  <tr>
                    <th style={headerStyle}>#</th>
                    <th style={headerStyle}>Cliente</th>
                    <th style={headerStyle}>Monto</th>
                    <th style={headerStyle}>Cuotas</th>
                    <th style={headerStyle}>Interés</th>
                    <th style={headerStyle}>Valor Cuota</th>
                        <th style={headerStyle}>Total</th>
                        <th style={headerStyle}>Abono T</th>
                        <th style={headerStyle}>Saldo</th>
                        <th style={headerStyle}>Fecha I</th>
                        <th style={headerStyle}>Actual</th>
                        <th style={headerStyle}>Orden</th>
                        <th style={headerStyle}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {prestamos.length === 0 && (
                    <tr><td colSpan={9} style={{textAlign:'center',padding:'2rem 0',color:'#888'}}>No hay préstamos</td></tr>
                  )}
                  {prestamos.map((p, idx) => {
                    const { valorCuota, totalPagar } = calculate(p.montoPrestado, p.tasa, p.cuotas);
                    return (
                      <tr key={p.id} style={{ background: idx%2? '#fff':'#fafafd', height:45 }}>
                        <td style={{...cellStyle, fontWeight:500}}>::</td>
                        <td style={cellStyle}>{p.cliente.nombreCompleto}</td>
                        <td style={cellStyle}>{Number(p.montoPrestado).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</td>
                        <td style={cellStyle}>{p.cuotas}</td>
                        <td style={cellStyle}>{Math.round(p.tasa*100)}%</td>
                        <td style={cellStyle}>{valorCuota>0 ? valorCuota.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : ''}</td>
                        <td style={cellStyle}>{totalPagar>0 ? totalPagar.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : ''}</td>
                        <td style={cellStyle}>{p.orden}</td>
                        <td style={{...cellStyle, background:'none'}}>-</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
        </div>
        <div>
          <Pagination page={page} totalPages={Math.ceil(total/pageSize)||1} onPrev={() => setPage(p=>Math.max(1,p-1))} onNext={() => setPage(p=>p+1)} />
        </div>
      </main>
    </div>
  );
}
