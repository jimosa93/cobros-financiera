"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Toast';
import { Navbar } from '@/components/Navbar';
import FormCard from '@/components/FormCard';
import { Field, Input, Select, ReadonlyInput } from '@/components/FormControls';

interface Cliente { id: number; nombreCompleto: string; }
const INTERESES = [0.1, 0.2, 0.3];

export default function EditarPrestamoPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [prestamo, setPrestamo] = useState<any>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [clienteId, setClienteId] = useState('');
  const [monto, setMonto] = useState('');
  const [cuotas, setCuotas] = useState('');
  const [tasa, setTasa] = useState(INTERESES[0]);
  const [nota, setNota] = useState('');

  useEffect(() => {
    if (!params.id) return;
    async function fetchData() {
      setLoading(true);
      const resp1 = await fetch(`/api/prestamos/${params.id}`);
      const data1 = await resp1.json();
      const resp2 = await fetch(`/api/clientes?pageSize=1000`);
      const data2 = await resp2.json();
      setPrestamo(data1.prestamo);
      setClientes(data2.clientes || []);
      setClienteId(data1.prestamo?.clienteId?.toString() || '');
      setMonto(data1.prestamo?.montoPrestado || '');
      setCuotas(data1.prestamo?.cuotas?.toString() || '');
      setTasa(data1.prestamo?.tasa || INTERESES[0]);
      setNota(data1.prestamo?.notas || '');
      setLoading(false);
    }
    fetchData();
  }, [params.id]);

  const toast = useToast();
  if (status === "loading" || loading) {
    return <div style={{textAlign:'center',padding:'2rem'}}><div style={{ width:40, height:40, borderRadius:'50%', border:'6px solid #e5e7eb', borderTop:'6px solid #0070f3', animation:'spin 1s linear infinite', margin:'0 auto' }} /></div>;
  }
  if (!session || session.user.rol !== "ADMIN") {
    router.replace("/");
    return null;
  }
  if (!prestamo) {
    return <div style={{textAlign:'center',padding:'2rem'}}>Préstamo no encontrado</div>;
  }

  // Calcular total a pagar y valor cuota
  const montoN = parseFloat(monto);
  const cuotasN = parseInt(cuotas, 10);
  const totalAPagar = !isNaN(montoN) && !isNaN(Number(tasa)) ? montoN * (1 + Number(tasa)) : 0;
  const valorCuota = totalAPagar && cuotasN > 0 ? totalAPagar / cuotasN : 0;

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    background: '#fff',
    color: '#232323',
    fontSize: '1rem',
    fontWeight: 400
  } as const;
  const labelStyle = {
    fontWeight: 500,
    display: 'block',
    marginBottom: 7,
    color: '#222',
    fontSize: 16
  } as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccessMsg(''); setGuardando(true);
    try {
      const res = await fetch(`/api/prestamos/${prestamo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: parseInt(clienteId, 10),
          montoPrestado: montoN,
          tasa: Number(tasa),
          cuotas: cuotasN,
          fechaInicio: prestamo.fechaInicio,
          notas: nota,
          cobradorId: prestamo.cobradorId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error inesperado");
      try { sessionStorage.setItem('globalToast', JSON.stringify({ message: 'Préstamo actualizado', type: 'success' })); } catch (e) {}
      router.push('/prestamos');
    } catch(err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Navbar />
      <FormCard title="Editar Préstamo" maxWidth="520px" titleCentered={true}>
        <form onSubmit={handleSubmit}>
          <Field label="Fecha">
            <ReadonlyInput value={prestamo.fechaInicio?.substr(0,10)} />
          </Field>
          <Field label="Cliente *">
            <Select value={clienteId} onChange={e => setClienteId(e.target.value)} required>
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
            <Select value={tasa} onChange={e => setTasa(Number(e.target.value))}>
              {INTERESES.map(i => (
                <option key={i} value={i}>{Math.round(i * 100)}%</option>
              ))}
            </Select>
          </Field>
          <Field label="Valor cuota">
            <ReadonlyInput value={valorCuota > 0 ? valorCuota.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : ''} tabIndex={-1} />
          </Field>
          <Field label="Total a pagar">
            <ReadonlyInput value={totalAPagar > 0 ? totalAPagar.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : ''} tabIndex={-1} />
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
                }}
              >
                {guardando ? 'Guardando…' : 'Guardar Cambios'}
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
                }}
              >
                Cancelar
              </button>
            </div>
            {error && <div style={{color:'#c33',marginTop:12,background:'#fee',padding:6,borderRadius:5,fontWeight:500}}>{error}</div>}
            {successMsg && <div style={{color:'#fff',marginTop:12,background:'#18b340',padding:7,borderRadius:5,fontWeight:700,fontSize:18, textAlign:'center'}}>{successMsg}</div>}
        </form>
      </FormCard>
    </div>
  );
}
