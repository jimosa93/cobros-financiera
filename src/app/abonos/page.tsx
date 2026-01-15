"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import React from "react";
import { searchBlock, inputStyle, primaryButton } from '@/styles/ui';
import SearchBar from '@/components/SearchBar';
import { IconButton, Pagination } from '@/components/TableControls';
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from '@/components/Toast';
import Spinner from "@/components/Spinner";

export default function AbonosPage() {
  const { data: session } = useSession();
  const isAdmin = !!session && session.user?.rol === 'ADMIN';
  const canCreateAbono = isAdmin || (!!session && session.user?.rol === 'COBRADOR');
  const router = useRouter();
  const toast = useToast();
  const [abonos, setAbonos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/abonos?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => {
        setAbonos(data.abonos || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, query]);

  async function eliminar(id: number) {
    if (!confirm("¿Eliminar abono?")) return;
    const res = await fetch(`/api/abonos/${id}`, { method: "DELETE" });
    const info = await res.json();
    if (!res.ok) {
      try { toast.addToast({ message: info.error || "No se pudo eliminar", type: 'error' }); } catch (e) { }
      return;
    }
    setAbonos(prev => prev.filter(a => a.id !== id));
    try { toast.addToast({ message: 'Abono eliminado', type: 'success' }); } catch (e) { }
  }

  const headerStyle = { textAlign: 'left' as const, fontWeight: 600, color: '#232323', fontSize: 16, background: '#f9fafe', padding: '13px 8px' };
  const cellStyle = { color: '#232323', fontSize: 15, background: '#fff', padding: '12px 8px', borderBottom: '1px solid #ecedef', fontWeight: 400 };

  return (
    <div className="app-bg">
      <Navbar />
      <main className="app-main">
        <h1 className="page-title">Abonos</h1>
        <SearchBar
          value={query}
          onChange={(v) => { setQuery(v); setPage(1); }}
          placeholder="Buscar por nota o cliente..."
          addHref="/abonos/nuevo"
          addLabel="+ Nuevo Abono"
          showAdd={canCreateAbono}
        />
        <div className="table-wrap" style={{ overflowX: 'auto' }}>
          {loading ? <div className="spinner-centered"><Spinner size={40} /></div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th className="table-header">Fecha</th>
                  <th className="table-header">Cliente</th>
                  <th className="table-header">Código crédito</th>
                  <th className="table-header">Abono</th>
                  <th className="table-header">Tipo</th>
                  <th className="table-header">Cobrador</th>
                  <th className="table-header">Nota</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {abonos.length === 0 && <tr><td colSpan={8} className="table-cell" style={{ textAlign: 'center', color: '#888' }}>No hay abonos</td></tr>}
                {abonos.map(a => (
                  <tr key={a.id}>
                    <td className="table-cell">{new Date(a.fecha).toISOString().substring(0, 10)}</td>
                    <td className="table-cell">{a.prestamo?.cliente?.nombreCompleto || '-'}</td>
                    <td className="table-cell">#{a.prestamoId}</td>
                    <td className="table-cell">{Number(a.monto).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</td>
                    <td className="table-cell">{a.tipoPago}</td>
                    <td className="table-cell">{a.cobrador?.nombreCompleto || '-'}</td>
                    <td className="table-cell">{a.notas || '-'}</td>
                    <td className="table-cell" style={{ background: 'none' }}>
                      {isAdmin ? (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <IconButton type="edit" onClick={() => router.push(`/abonos/${a.id}/editar`)} />
                          <IconButton type="delete" onClick={() => eliminar(a.id)} />
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / pageSize))} onPrev={() => setPage(p => Math.max(1, p - 1))} onNext={() => setPage(p => p + 1)} />
      </main>
    </div>
  );
}

