"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from '@/components/Toast';
import { Navbar } from "@/components/Navbar";
import FormCard from '@/components/FormCard';
import Spinner from "@/components/Spinner";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/users/${params.id}`).then(r => r.json()).then(data => {
      if (data.user) {
        setForm({
          nombreCompleto: data.user.nombreCompleto || "",
          celular: data.user.celular || "",
          email: data.user.email || "",
          alias: data.user.alias || "",
          rol: data.user.rol || "COBRADOR",
          placaMoto: data.user.placaMoto || "",
          fechaTecnico: data.user.fechaTecnico ? data.user.fechaTecnico.substr(0, 10) : "",
          fechaSoat: data.user.fechaSoat ? data.user.fechaSoat.substr(0, 10) : "",
        });
      }
    }).finally(() => setLoading(false));
  }, [params.id]);

  const toast = useToast();
  if (status === "loading" || loading) {
    return <div style={{ overflowX: 'auto', background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '1.6rem 1.1rem', height: '100vh' }}>
      <Spinner size={40} />
    </div>;
  }
  if (!session || session.user.rol !== "ADMIN") { router.replace("/"); return null; }

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const res = await fetch(`/api/users/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar");
      try { sessionStorage.setItem('globalToast', JSON.stringify({ message: 'Usuario actualizado', type: 'success' })); window.dispatchEvent(new Event('global-toast')); } catch (e) { }
      router.push("/users");
    } catch (err: any) {
      setError(err.message || "Error");
    } finally { setSaving(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Navbar />
      <FormCard title="Editar Usuario" maxWidth="800px" titleCentered={true}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#555', fontWeight: 500 }}>Nombre Completo</label>
            <input name="nombreCompleto" value={form.nombreCompleto || ""} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '1rem', color: '#232323', background: '#fff' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#555', fontWeight: 500 }}>Email</label>
            <input name="email" value={form.email || ""} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '1rem', color: '#232323', background: '#fff' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#555', fontWeight: 500 }}>Celular</label>
            <input name="celular" value={form.celular || ""} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '1rem', color: '#232323', background: '#fff' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#555', fontWeight: 500 }}>Rol</label>
            <select name="rol" value={form.rol || "COBRADOR"} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '1rem', color: '#232323', background: '#fff' }}>
              <option value="COBRADOR">Cobrador</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <div style={{ marginTop: '2rem' }}>
            <button type="submit" disabled={saving} style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: saving ? '#999' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}>{saving ? "Guardando..." : "Guardar"}</button>
            <button type="button" onClick={() => router.push("/users")} disabled={saving} style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem', background: 'white', color: '#0070f3', border: '1px solid #0070f3', borderRadius: 4 }}>Cancelar</button>
          </div>
          {error && <div style={{ color: "#c33", marginTop: 12, padding: 8, background: '#fee', borderRadius: 4 }}>{error}</div>}
        </form>
      </FormCard>
    </div>
  );
}

