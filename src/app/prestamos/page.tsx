"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useToast } from '@/components/Toast';
// removed unused style imports
import SearchBar from '@/components/SearchBar';
import { Pagination } from '@/components/TableControls';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, DragEndEvent } from '@dnd-kit/core';
import React from "react";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSession } from 'next-auth/react';
import Spinner from "@/components/Spinner";

interface Prestamo {
  id: number;
  cliente: { nombreCompleto: string };
  montoPrestado: string;
  tasa: number;
  cuotas: number;
  notas?: string;
  orden: number;
  estado?: string;
  fechaInicio?: string;
}

function RowSortable({ p, idx, children, rowClassName }: { p: Prestamo, idx: number; children: React.ReactNode; rowClassName?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    background: idx % 2 ? '#fff' : '#fafafd',
    height: 45,
    cursor: 'default',
    boxShadow: isDragging ? '0 2px 8px #3a8dde22' : 'none'
  };

  // Attach drag listeners only to the first child (the handle cell)
  const childrenArray = React.Children.toArray(children);
  const first = childrenArray[0];
  const rest = childrenArray.slice(1);
  const firstWithHandle = React.isValidElement(first)
    ? React.cloneElement(first as React.ReactElement<{ style?: React.CSSProperties }>, {
      ...attributes,
      ...listeners,
      style: { ...((first as React.ReactElement<{ style?: React.CSSProperties }>).props.style || {}), cursor: 'grab' },
    })
    : first;

  return (
    <tr ref={setNodeRef} className={rowClassName} style={style}>
      {firstWithHandle}
      {rest}
    </tr>
  );
}

export default function PrestamosPage() {
  const { data: session } = useSession();
  const isAdmin = !!session && session.user?.rol === 'ADMIN';
  const toast = useToast();

  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  // removed unused error state
  const [abonoSums, setAbonoSums] = useState<Record<number, number>>({});
  const [abonosToday, setAbonosToday] = useState<Set<number>>(new Set());
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
      // mostrar solo préstamos activos en esta vista
      const activeItems = items.filter((p: Prestamo) => (p.estado ?? 'ACTIVO') === 'ACTIVO');
      setPrestamos(activeItems);
      setTotal(data.total || 0);

      // fetch abono sums for each prestamo
      try {
        const sums = await Promise.all(activeItems.map(async (p: Prestamo) => {
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
        // fetch prestamo ids that have abonos today
        try {
          const now = new Date();
          const startLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          const endLocal = new Date(startLocal.getTime() + 24 * 60 * 60 * 1000);
          const r2 = await fetch(`/api/reports/abonos-today?start=${encodeURIComponent(startLocal.toISOString())}&end=${encodeURIComponent(endLocal.toISOString())}`);
          const j2 = await r2.json();
          const ids: number[] = j2.prestamoIds || [];
          setAbonosToday(new Set(ids));
        } catch {
          setAbonosToday(new Set());
        }
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
    if (!confirm('¿Eliminar este préstamo de forma permanente?')) return;
    setMoving(true);
    const res = await fetch(`/api/prestamos/${id}`, { method: 'DELETE' });
    const info = await res.json();
    setMoving(false);
    if (!res.ok) alert(info.error || 'No se pudo eliminar');
    else setPrestamos(prev => prev.filter(p => p.id !== id));
    if (res.ok) toast.addToast({ message: 'Préstamo eliminado', type: 'success' });
    else toast.addToast({ message: info.error || 'Error eliminando préstamo', type: 'error' });
  }

  return (
    <div className="app-bg">
      <Navbar />
      <main className="app-main">
        <h1 className="page-title">Préstamos</h1>
        <SearchBar
          value={query}
          onChange={(v) => { setQuery(v); setPage(1); }}
          placeholder="Buscar por cliente o nota..."
          addHref="/prestamos/nuevo"
          addLabel="+ Nuevo Préstamo"
          showAdd={isAdmin}
        />
        <div className="table-wrap" style={{ overflowX: 'auto', padding: '1.6rem 1.1rem' }}>
          {loading ? (
            <div className="spinner-centered"><Spinner size={40} /></div>
          ) : (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={prestamos.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                    <thead>
                      <tr>
                        <th className="table-header">#</th>
                        <th className="table-header">Id</th>
                        <th className="table-header">Cliente</th>
                        <th className="table-header">Monto</th>
                        <th className="table-header">Cuotas</th>
                        <th className="table-header">Interés</th>
                        <th className="table-header">Valor Cuota</th>
                        <th className="table-header">Total</th>
                        <th className="table-header">Abono T</th>
                        <th className="table-header">Saldo</th>
                        <th className="table-header">Fecha I</th>
                        <th className="table-header">Actual</th>
                        <th className="table-header">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prestamos.length === 0 && (
                        <tr><td colSpan={9} className="table-cell" style={{ textAlign: 'center', padding: '2rem 0', color: '#888' }}>No hay préstamos</td></tr>
                      )}
                      {prestamos.map((p, idx) => {
                        const { valorCuota, totalPagar } = calculate(p.montoPrestado, p.tasa, p.cuotas);
                        const highlightClass = abonosToday.has(p.id) ? 'row-highlight' : undefined;
                        return (
                          <RowSortable p={p} idx={idx} key={p.id} rowClassName={highlightClass}>
                            <td className="table-cell" style={{ cursor: 'grab', fontWeight: 500 }}>::</td>
                            <td className="table-cell">{p.id}</td>
                            <td className="table-cell">{p.cliente.nombreCompleto}</td>
                            <td className="table-cell">{Number(p.montoPrestado).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '')}</td>
                            <td className="table-cell">{p.cuotas}</td>
                            <td className="table-cell">{Math.round(p.tasa * 100)}%</td>
                            <td className="table-cell">{valorCuota > 0 ? valorCuota.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '') : ''}</td>
                            <td className="table-cell">{totalPagar > 0 ? totalPagar.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '') : ''}</td>
                            <td className="table-cell">{(abonoSums[p.id] || 0) > 0 ? (abonoSums[p.id] || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '') : '-'}</td>
                            <td className="table-cell">{(totalPagar - (abonoSums[p.id] || 0)) >= 0 ? (totalPagar - (abonoSums[p.id] || 0)).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '') : '-'}</td>
                            <td className="table-cell">{p.fechaInicio ? new Date(p.fechaInicio).toLocaleDateString('es-ES') : '-'}</td>
                            <td className="table-cell">{valorCuota > 0 ? Math.floor((abonoSums[p.id] || 0) / valorCuota) : 0}</td>
                            {isAdmin ? (
                              <td className="table-cell" style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                                <button aria-label="Editar" title="Editar" onClick={() => window.location.href = `/prestamos/${p.id}/editar`} style={{ padding: 8, border: '1px solid #bbb', background: 'white', borderRadius: 6, cursor: 'pointer' }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="#0070f3" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="#0070f3" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </button>
                                <button aria-label="Eliminar" title="Eliminar" onClick={() => eliminarPrestamo(p.id)} style={{ padding: 8, border: '1px solid #e57373', background: '#e57373', borderRadius: 6, cursor: 'pointer' }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 11v6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 11v6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </button>
                                <button aria-label="Tarjeta" title="Tarjeta" onClick={() => window.location.href = `/tarjeta-virtual?prestamoId=${p.id}`} style={{ padding: 8, border: '1px solid #ccc', background: 'white', borderRadius: 6, cursor: 'pointer' }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="20" height="14" rx="2" stroke="#111" strokeWidth="1.2" /><path d="M7 8h10" stroke="#111" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </button>
                              </td>) : (
                              <td className="table-cell"> - </td>
                            )}
                          </RowSortable>
                        );
                      })}
                    </tbody>
                  </table>
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>
        <div>
          <Pagination page={page} totalPages={Math.ceil(total / pageSize) || 1} onPrev={() => setPage(p => Math.max(1, p - 1))} onNext={() => setPage(p => p + 1)} />
        </div>
      </main>
    </div>
  );
}
