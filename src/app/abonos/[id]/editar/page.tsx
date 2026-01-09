"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import FormCard from '@/components/FormCard';
import { useSession } from "next-auth/react";
import { Field, Input, Select, ReadonlyInput } from '@/components/FormControls';
import Spinner from "@/components/Spinner";

const TIPOS = ["EFECTIVO", "CON-SUPERVISOR", "CON-JEFE"];

export default function EditAbonoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [abono, setAbono] = useState<any>(null);
  const [prestamos, setPrestamos] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    const load = async () => {
      setLoading(true);
      const r = await fetch(`/api/abonos/${params.id}`);
      const d = await r.json();
      if (d.abono) {
        setAbono(d.abono);
        setForm({
          prestamoId: d.abono.prestamoId?.toString() || "",
          monto: d.abono.monto || "",
          tipoPago: d.abono.tipoPago || TIPOS[0],
          notas: d.abono.notas || "",
          fecha: d.abono.fecha ? d.abono.fecha.substr(0, 10) : "",
        });
      }
      // load prestamos for selection
      const rp = await fetch("/api/prestamos?pageSize=1000");
      const dp = await rp.json();
      setPrestamos(dp.prestamos || []);
      setLoading(false);
    };
    load();
  }, [params.id]);

  if (status === "loading" || loading) {
    return <div style={{ overflowX: 'auto', background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '1.6rem 1.1rem', height: '100vh' }}>
      <Spinner size={40} />
    </div>;
  }
  if (!session || session.user.rol !== "ADMIN") { router.replace("/"); return null; }

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/abonos/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prestamoId: Number(form.prestamoId),
          monto: Number(form.monto),
          tipoPago: form.tipoPago,
          notas: form.notas || null,
          fecha: form.fecha,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar");
      try { sessionStorage.setItem('globalToast', JSON.stringify({ message: 'Abono actualizado', type: 'success' })); window.dispatchEvent(new Event('global-toast')); } catch (e) { }
      router.push("/abonos");
    } catch (err: any) {
      alert(err.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Navbar />
      <FormCard title="Editar Abono" maxWidth="800px" titleCentered={true}>
        <form onSubmit={handleSubmit}>
          <Field label="Fecha">
            <ReadonlyInput name="fecha" value={form.fecha || ""} />
          </Field>
          <Field label="Id Préstamo">
            <Select name="prestamoId" value={form.prestamoId || ""} onChange={handleChange}>
              <option value="">Seleccione préstamo...</option>
              {prestamos.map((p: any) => <option key={p.id} value={p.id}>#{p.id} - {p.cliente?.nombreCompleto} - {Number(p.montoPrestado).toLocaleString('es-CO')}</option>)}
            </Select>
          </Field>
          <Field label="Monto">
            <Input name="monto" value={form.monto || ""} onChange={handleChange} />
          </Field>
          <Field label="Tipo">
            <Select name="tipoPago" value={form.tipoPago || TIPOS[0]} onChange={handleChange}>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Nota">
            <Input name="notas" value={form.notas || ""} onChange={handleChange} />
          </Field>
          <div style={{ marginTop: '2rem' }}>
            <button type="submit" disabled={saving} style={{
              width: '100%',
              padding: '0.75rem',
              background: saving ? '#999' : '#0070f3',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontSize: '1rem',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}>{saving ? 'Guardando...' : 'Guardar'}</button>
            <button type="button" onClick={() => router.push("/abonos")} style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem', border: '1px solid #0070f3', borderRadius: 4, background: 'white', color: '#0070f3' }}>Cancelar</button>
          </div>
        </form>
      </FormCard>
    </div>
  );
}

