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

  async function eliminar(id:number) {
    if (!confirm("¿Eliminar abono?")) return;
    const res = await fetch(`/api/abonos/${id}`, { method: "DELETE" });
    const info = await res.json();
    if (!res.ok) {
      try { toast.addToast({ message: info.error || "No se pudo eliminar", type: 'error' }); } catch (e) {}
      return;
    }
    setAbonos(prev => prev.filter(a => a.id !== id));
    try { toast.addToast({ message: 'Abono eliminado', type: 'success' }); } catch (e) {}
  }

  const headerStyle = { textAlign:'left' as const, fontWeight:600, color:'#232323', fontSize:16, background:'#f9fafe', padding:'13px 8px' };
  const cellStyle = { color:'#232323', fontSize:15, background:'#fff', padding:'12px 8px', borderBottom:'1px solid #ecedef', fontWeight:400 };

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5' }}>
      <Navbar />
      <main style={{ maxWidth:1100, margin:'0 auto', padding:'2rem' }}>
        <h1 style={{ fontWeight:700, fontSize: '2rem', color:'#222' }}>Abonos</h1>
        <SearchBar
          value={query}
          onChange={(v) => { setQuery(v); setPage(1); }}
          placeholder="Buscar por nota o cliente..."
          addHref="/abonos/nuevo"
          addLabel="+ Nuevo Abono"
          showAdd={canCreateAbono}
        />
        <div style={{ background:'white', borderRadius:12, padding:16, boxShadow:'0 2px 8px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
          {loading ? <div style={{ padding:20, textAlign:'center' }}><div style={{ width:40, height:40, borderRadius:'50%', border:'6px solid #e5e7eb', borderTop:'6px solid #0070f3', animation:'spin 1s linear infinite', margin:'0 auto' }} /></div> : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={headerStyle}>Fecha</th>
                  <th style={headerStyle}>Cliente</th>
                  <th style={headerStyle}>Código crédito</th>
                  <th style={headerStyle}>Abono</th>
                  <th style={headerStyle}>Tipo</th>
                  <th style={headerStyle}>Cobrador</th>
                  <th style={headerStyle}>Nota</th>
                  <th style={headerStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {abonos.length === 0 && <tr><td colSpan={8} style={{ padding:20, textAlign:'center', color:'#888' }}>No hay abonos</td></tr>}
                {abonos.map(a => (
                  <tr key={a.id}>
                    <td style={cellStyle}>{new Date(a.fecha).toISOString().substring(0,10)}</td>
                    <td style={cellStyle}>{a.prestamo?.cliente?.nombreCompleto || '-'}</td>
                    <td style={cellStyle}>#{a.prestamoId}</td>
                    <td style={cellStyle}>{Number(a.monto).toLocaleString('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 })}</td>
                    <td style={cellStyle}>{a.tipoPago}</td>
                    <td style={cellStyle}>{a.cobrador?.nombreCompleto || '-'}</td>
                    <td style={cellStyle}>{a.notas || '-'}</td>
                    <td style={{ ...cellStyle, background:'none' }}>
                      {isAdmin ? (
                        <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                          <IconButton type="edit" onClick={()=>router.push(`/abonos/${a.id}/editar`)} />
                          <IconButton type="delete" onClick={()=>eliminar(a.id)} />
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / pageSize))} onPrev={() => setPage(p=>Math.max(1,p-1))} onNext={() => setPage(p=>p+1)} />
      </main>
    </div>
  );
}

