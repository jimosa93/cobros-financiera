"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import FormCard from '@/components/FormCard';
import { Field, Input, Select, ReadonlyInput } from '@/components/FormControls';

interface Cliente {
  id: number;
  nombreCompleto: string;
}

const INTERESES = [0.1, 0.2, 0.3];

export default function NuevoPrestamoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargandoClientes, setCargandoClientes] = useState(true);
  const [error, setError] = useState<string>("");
  
  // Form state
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

  // Cargar clientes existentes
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await fetch("/api/clientes?pageSize=1000");
        const data = await res.json();
        setClientes(data.clientes || []);
      } finally {
        setCargandoClientes(false);
      }
    };
    fetchClientes();
  }, []);

  if (status === "loading") {
    return <div style={{textAlign:'center',padding:'2rem'}}><div style={{ width:40, height:40, borderRadius:'50%', border:'6px solid #e5e7eb', borderTop:'6px solid #0070f3', animation:'spin 1s linear infinite', margin:'0 auto' }} /></div>;
  }
  if (!session || session.user.rol !== "ADMIN") {
    router.replace("/");
    return null;
  }

  // Calcular total a pagar y valor cuota
  const montoN = parseFloat(monto);
  const cuotasN = parseInt(cuotas, 10);
  const totalAPagar = !isNaN(montoN) && !isNaN(tasa) ? montoN * (1 + tasa) : 0;
  const valorCuota = totalAPagar && cuotasN > 0 ? totalAPagar / cuotasN : 0;

  const inputField = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    marginBottom: 0,
    background: '#f1f1f1',
    color: '#222'
  };
  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#555',
    fontWeight: 500
  };


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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error inesperado");
      try { sessionStorage.setItem('globalToast', JSON.stringify({ message: 'Préstamo creado', type: 'success' })); window.dispatchEvent(new Event('global-toast')); } catch (e) {}
      router.push('/prestamos');
    } catch (err: any) {
      setError(err.message || "Error inesperado");
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
            <Field label="Cliente *">
              <Select value={clienteId} onChange={e => setClienteId(e.target.value)} required>
                <option value="" disabled>Selecciona un cliente…</option>
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
