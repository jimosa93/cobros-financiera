"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import FormCard from '@/components/FormCard';
import { Field, Input, Select, ReadonlyInput } from '@/components/FormControls';
import { usePermissions } from "@/contexts/PermissionsContext";

interface Cliente {
  id: number;
  nombreCompleto: string;
  rutaId: number;
}

interface Ruta {
  id: number;
  nombre: string;
  activo: boolean;
}

const INTERESES = [0.1, 0.2, 0.3];

export default function NuevoPrestamoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { can, loading: loadingPerms } = usePermissions();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [error, setError] = useState<string>("");

  const [rutaId, setRutaId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [monto, setMonto] = useState("");
  const [cuotas, setCuotas] = useState("");
  const [tasa, setTasa] = useState(INTERESES[1]);
  const now = new Date();
  const [fechaDisplay] = useState(() => now.toLocaleDateString('es-ES'));
  const [fechaISOFull] = useState(() => now.toISOString());
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (status === 'loading' || loadingPerms) return;
    if (!session) return;
    if (!can('PRESTAMOS_CREATE')) return;

    const fetchRutas = async () => {
      const res = await fetch("/api/rutas");
      const data = await res.json();
      setRutas(data.rutas || []);
    };
    fetchRutas().catch(console.error);
  }, [status, loadingPerms, session, can]);

  useEffect(() => {
    if (status === 'loading' || loadingPerms) return;
    if (!session) {
      router.replace('/login');
      return;
    }
    if (!can('PRESTAMOS_CREATE')) {
      router.replace('/');
    }
  }, [status, loadingPerms, session, can, router]);

  useEffect(() => {
    if (rutaId) {
      const fetchClientes = async () => {
        const res = await fetch(`/api/clientes?pageSize=1000&rutaId=${rutaId}`);
        const data = await res.json();
        setClientes(data.clientes || []);
      };
      fetchClientes().catch(console.error);
    } else {
      setClientes([]);
    }
    setClienteId("");
  }, [rutaId]);

  if (status === "loading" || loadingPerms) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '6px solid #e5e7eb', borderTop: '6px solid #0070f3', animation: 'spin 1s linear infinite', margin: '0 auto' }} /></div>;
  }
  if (!session || !can('PRESTAMOS_CREATE')) return null;

  // Calcular total a pagar y valor cuota
  const montoN = parseFloat(monto);
  const cuotasN = parseInt(cuotas, 10);
  const totalAPagar = !isNaN(montoN) && !isNaN(tasa) ? montoN * (1 + tasa) : 0;
  const valorCuota = totalAPagar && cuotasN > 0 ? totalAPagar / cuotasN : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setGuardando(true);
    try {
      const res = await fetch("/api/prestamos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: parseInt(clienteId, 10),
          montoPrestado: montoN,
          tasa,
          cuotas: cuotasN,
          fechaInicio: fechaISOFull,
          notas: nota,
          cobradorId: session.user.id,
          rutaId: parseInt(rutaId, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error inesperado");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      try { sessionStorage.setItem('globalToast', JSON.stringify({ message: 'Préstamo creado', type: 'success' })); window.dispatchEvent(new Event('global-toast')); } catch (e) { }
      router.push('/prestamos');
    } catch (err: unknown) {
      console.error('Error creating prestamo:', err);
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Navbar />
      <FormCard title="Nuevo Préstamo" maxWidth="600px" titleCentered={true}>
        <form onSubmit={handleSubmit}>
          {/* form fields standardized via FormControls */}
          <Field label="Fecha">
            <ReadonlyInput value={fechaDisplay} type="text" />
          </Field>
          <Field label="Ruta *">
            <Select value={rutaId} onChange={e => setRutaId(e.target.value)} required>
              <option value="" disabled>Selecciona una ruta…</option>
              {rutas.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </Select>
          </Field>
          <Field label="Cliente *">
            <Select value={clienteId} onChange={e => setClienteId(e.target.value)} required disabled={!rutaId}>
              <option value="" disabled>
                {rutaId ? 'Selecciona un cliente…' : 'Primero selecciona una ruta'}
              </option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombreCompleto}</option>
              ))}
            </Select>
          </Field>
          <Field label="Monto *">
            <Input
              value={monto}
              onChange={e => setMonto(e.target.value.replace(/[^\d.]/g, ''))}
              type="number"
              min={1}
              required
            />
          </Field>
          <Field label="Nº de cuotas *">
            <Input
              value={cuotas}
              onChange={e => setCuotas(e.target.value.replace(/[^\d]/g, ''))}
              type="number"
              min={1}
              required
            />
          </Field>
          <Field label="Intereses *">
            <Select value={String(tasa)} onChange={e => setTasa(Number(e.target.value))}>
              {INTERESES.map(i => (
                <option key={i} value={String(i)}>{Math.round(i * 100)}%</option>
              ))}
            </Select>
          </Field>
          <Field label="Valor cuota">
            <ReadonlyInput
              value={valorCuota > 0 ? valorCuota.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : ''}
              tabIndex={-1}
            />
          </Field>
          <Field label="Total a pagar">
            <ReadonlyInput
              value={totalAPagar > 0 ? totalAPagar.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : ''}
              tabIndex={-1}
            />
          </Field>
          <Field label="Nota">
            <Input value={nota} onChange={e => setNota(e.target.value)} type="text" maxLength={100} />
          </Field>
          <div style={{ marginTop: '2rem' }}>
            <button
              type="submit"
              disabled={guardando}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: guardando ? '#999' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: guardando ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}>
              {guardando ? 'Guardando…' : 'Crear Préstamo'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/prestamos')}
              disabled={guardando}
              style={{
                width: '100%',
                marginTop: '0.75rem',
                padding: '0.75rem',
                backgroundColor: 'white',
                color: '#0070f3',
                border: '1px solid #0070f3',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: guardando ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}>
              Cancelar
            </button>
          </div>
          {error && (
            <div style={{
              marginTop: '1rem',
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>{error}</div>
          )}
          {successMsg && (
            <div style={{
              marginTop: '1rem',
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: '#efe',
              color: '#3c3',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>{successMsg}</div>
          )
          }
        </form>
      </FormCard>
    </div>
  );
}
