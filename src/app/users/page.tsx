"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import React from "react";
import { searchBlock, inputStyle, primaryButton } from '@/styles/ui';
import SearchBar from '@/components/SearchBar';
import { IconButton, Pagination } from '@/components/TableControls';
import { useRouter } from "next/navigation";
import { useToast } from '@/components/Toast';
import Spinner from '@/components/Spinner';

interface User {
  id: number;
  nombreCompleto: string;
  celular: string;
  email: string;
  alias?: string | null;
  rol: string;
  fechaCreacion: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => {
        setUsers(data.users || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, query]);

  async function eliminar(id: number) {
    if (!confirm("¿Eliminar usuario?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const info = await res.json();
    if (!res.ok) {
      toast.addToast({ message: info.error || "No se pudo eliminar", type: 'error' });
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    toast.addToast({ message: 'Usuario eliminado', type: 'success' });
  }
  const headerStyle: React.CSSProperties = { textAlign: 'left', fontWeight: 600, color: '#232323', fontSize: 16, background: '#f9fafe', padding: '13px 8px' };
  const cellStyle: React.CSSProperties = { color: '#232323', fontSize: 15, background: '#fff', padding: '12px 8px', borderBottom: '1px solid #ecedef', fontWeight: 400 };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>
        <h1 style={{ fontWeight: 700, fontSize: "2rem", color: "#222" }}>Usuarios</h1>
        <SearchBar
          value={query}
          onChange={(v) => { setQuery(v); setPage(1); }}
          placeholder="Buscar por nombre o email..."
          addHref="/register"
          addLabel="+ Nuevo Usuario"
          showAdd={true}
        />

        <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflowX: 'auto' }}>

          {loading ? <div style={{ padding: 20, textAlign: 'center' }}><Spinner size={40} /></div> : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={headerStyle}>Nombre</th>
                  <th style={headerStyle}>Email</th>
                  <th style={headerStyle}>Celular</th>
                  <th style={headerStyle}>Alias</th>
                  <th style={headerStyle}>Rol</th>
                  <th style={headerStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ background: '#fff' }}>
                    <td style={cellStyle}>{u.nombreCompleto}</td>
                    <td style={cellStyle}>{u.email}</td>
                    <td style={cellStyle}>{u.celular}</td>
                    <td style={cellStyle}>{u.alias || "-"}</td>
                    <td style={cellStyle}>{u.rol}</td>
                    <td style={{ ...cellStyle, background: 'none', display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <IconButton type="edit" onClick={() => router.push(`/users/${u.id}/editar`)} />
                      <IconButton type="delete" onClick={() => eliminar(u.id)} />
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: "center" }}>No hay usuarios</td></tr>}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / pageSize))} onPrev={() => setPage(p => Math.max(1, p - 1))} onNext={() => setPage(p => p + 1)} />
      </main>
    </div>
  );
}

