"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Field, Input, Select } from '@/components/FormControls';

interface Cliente {
  id: number;
  nombreCompleto: string;
}

interface PrestamoSimple {
  id: number;
  cliente: Cliente;
  montoPrestado?: string;
  tasa?: number;
  cuotas?: number;
  fechaInicio?: string;
  estado?: string;
  notas?: string;
}

interface AbonoSimple {
  prestamoId: number;
  prestamo?: PrestamoSimple;
  monto: string;
  fecha?: string;
}

const TIPOS = ["EFECTIVO", "CON-SUPERVISOR", "CON-JEFE"];

export default function NuevoAbonoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [prestamos, setPrestamos] = useState<PrestamoSimple[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [prestamoId, setPrestamoId] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [success] = useState("");
  const now = new Date();
  const fecha = now.toLocaleDateString('es-ES'); // display dd/mm/yyyy
  const fechaISOFull = now.toISOString(); // full ISO with time for storage

  // Count business days excluding Sundays between two dates (inclusive).
  function businessDaysExcludingSundaysInclusive(start: Date, end: Date): number {
    if (!start || !end) return 0;
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    if (e < s) return 0;
    let count = 0;
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0) count++;
    }
    return count;
  }

  // compute final date by adding `cuotas` calendar days skipping Sundays.
  // The start date does NOT count (i.e. cuotas=1 -> next working day after start, skipping Sundays).
  function addDaysSkippingSundaysExcludingStart(startIso?: string, cuotas?: number): Date | null {
    if (!startIso) return null;
    const d = new Date(startIso);
    if (isNaN(d.getTime())) return null;
    const daysToAdd = Math.max(0, Number(cuotas) || 0);
    let added = 0;
    while (added < daysToAdd) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0) { // not Sunday
        added++;
      }
    }
    return d;
  }

  useEffect(() => {
    // Load only clients that have at least one ACTIVO prestamo
    (async () => {
      try {
        const res = await fetch("/api/prestamos?pageSize=1000");
        const d = await res.json();
        const prestamos: PrestamoSimple[] = d.prestamos || [];
        const activePrestamos = prestamos.filter(p => (p.estado ?? 'ACTIVO') === 'ACTIVO');
        const map = new Map<number, Cliente>();
        activePrestamos.forEach(p => {
          if (p.cliente && !map.has(p.cliente.id)) map.set(p.cliente.id, p.cliente);
        });
        setClientes(Array.from(map.values()));
      } catch {
        setClientes([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!clienteId) { setPrestamos([]); setPrestamoId(""); return; }
    fetch(`/api/prestamos?clienteId=${clienteId}&pageSize=1000`).then(r => r.json()).then(d => {
      const list: PrestamoSimple[] = d.prestamos || [];
      // Mostrar sólo préstamos activos para registrar abonos
      setPrestamos(list.filter((p) => (p.estado ?? 'ACTIVO') === 'ACTIVO'));
    });
  }, [clienteId]);

  const [prestamoDetails, setPrestamoDetails] = useState<PrestamoSimple | null>(null);
  const [sumaAbonos, setSumaAbonos] = useState<number>(0);
  const [lastAbono, setLastAbono] = useState<AbonoSimple | null>(null);
  const [lastAbonoSum, setLastAbonoSum] = useState<number>(0);

  useEffect(() => {
    if (!prestamoId) { setPrestamoDetails(null); setSumaAbonos(0); return; }
    // fetch prestamo details
    fetch(`/api/prestamos/${prestamoId}`).then(r => r.json()).then(d => {
      if (d.prestamo) setPrestamoDetails(d.prestamo);
      else setPrestamoDetails(null);
    });
    // fetch sum of abonos for this prestamo
    fetch(`/api/abonos?prestamoId=${prestamoId}`).then(r => r.json()).then(d => {
      const sum = d.sumMonto ? parseFloat(d.sumMonto) : 0;
      setSumaAbonos(sum);
    });
  }, [prestamoId]);

  // fetch last abono overall (most recent)
  useEffect(() => {
    fetch(`/api/abonos?page=1&pageSize=1`).then(r => r.json()).then(async d => {
      const a: AbonoSimple | null = (d.abonos && d.abonos.length > 0) ? d.abonos[0] : null;
      setLastAbono(a);
      if (a) {
        try {
          const sres = await fetch(`/api/abonos?prestamoId=${a.prestamoId}`);
          const sd = await sres.json();
          const sum = sd.sumMonto ? parseFloat(sd.sumMonto) : 0;
          setLastAbonoSum(sum);
        } catch {
          setLastAbonoSum(0);
        }
      } else {
        setLastAbonoSum(0);
      }
    });
  }, []);

  if (status === "loading") return <div style={{ padding: 20, textAlign: 'center' }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '6px solid #e5e7eb', borderTop: '6px solid #0070f3', animation: 'spin 1s linear infinite', margin: '0 auto' }} /></div>;
  if (!session) { router.replace("/login"); return null; }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const res = await fetch("/api/abonos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prestamoId: Number(prestamoId), monto: Number(monto), tipoPago: tipo, notas: nota, fecha: fechaISOFull })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      try { sessionStorage.setItem('globalToast', JSON.stringify({ message: 'Abono registrado', type: 'success' })); window.dispatchEvent(new Event('global-toast')); } catch { }
      router.push('/abonos');
      // update last abono to the one just created (data.abono)
      if (data.abono) {
        setLastAbono(data.abono as AbonoSimple);
        // refresh sum for that prestamo
        try {
          const sres = await fetch(`/api/abonos?prestamoId=${data.abono.prestamoId}`);
          const sd = await sres.json();
          const sum = sd.sumMonto ? parseFloat(sd.sumMonto) : 0;
          setLastAbonoSum(sum);
        } catch (error) {
          console.error('Error fetching abono sum:', error);
          setLastAbonoSum(0);
        }
      }
    } catch (error) {
      console.error('Error creating abono:', error);
      alert("Error");
    } finally { setGuardando(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={{ background: "white", padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h1 style={{ fontWeight: 700, fontSize: '1.7rem', marginBottom: 12, color: '#222' }}>Registrar Abono</h1>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: '#555' }}>Fecha</label>
                  <input value={fecha} readOnly style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 4, background: '#f1f1f1', color: '#232323', fontSize: '1rem' }} />
                </div>
                <Field label="Cliente">
                  <Select value={clienteId} onChange={e => setClienteId(e.target.value)}>
                    <option value="">Seleccione cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombreCompleto}</option>)}
                  </Select>
                </Field>
                <Field label="Id Préstamo">
                  <Select value={prestamoId} onChange={e => setPrestamoId(e.target.value)}>
                    <option value="">Seleccione préstamo...</option>
                    {prestamos.map(p => <option key={p.id} value={p.id}>#{p.id} - ${Number(p.montoPrestado).toLocaleString('es-CO')} - {p.fechaInicio ? new Date(p.fechaInicio).toLocaleDateString('es-ES') : '-'}</option>)}
                  </Select>
                </Field>
                <Field label="Monto">
                  <Input value={monto} onChange={e => setMonto(e.target.value.replace(/[^0-9.]/g, ''))} />
                </Field>
                <Field label="Tipo">
                  <Select value={tipo} onChange={e => setTipo(e.target.value)}>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </Field>
                <Field label="Nota">
                  <Input value={nota} onChange={e => setNota(e.target.value)} />
                </Field>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => router.push('/abonos')} style={{ padding: '0.6rem 1rem', border: '1px solid #ddd', borderRadius: 4 }}>Cancelar</button>
                  <button type="submit" disabled={guardando} style={{ padding: '0.6rem 1rem', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4 }}>{guardando ? 'Guardando...' : 'Registrar Abono'}</button>
                </div>
                {success && <div style={{ marginTop: 12, background: '#18b340', color: '#fff', padding: 8, borderRadius: 4 }}>{success}</div>}
              </form>
            </div>
          </div>
          {/* Summary panel on the right */}
          <div style={{ width: 360, minWidth: 260 }}>
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <h3 style={{ marginTop: 0, marginBottom: 12, color: '#222' }}>Resumen préstamo</h3>
              {prestamoDetails ? (
                <div style={{ color: '#222', lineHeight: 1.6 }}>
                  <div><strong>Código crédito:</strong> <span style={{ color: '#222' }}>#{prestamoDetails.id}</span></div>
                  <div><strong>Valor prestado:</strong> <span style={{ color: '#222' }}>{Number(prestamoDetails.montoPrestado ?? '0').toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '')}</span></div>
                  <div><strong>Total crédito:</strong> <span style={{ color: '#222' }}>{(Number(prestamoDetails.montoPrestado ?? '0') * (1 + Number(prestamoDetails.tasa ?? 0))).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '')}</span></div>
                  <div><strong>Fecha Inicial:</strong> <span style={{ color: '#222' }}>{prestamoDetails.fechaInicio ? new Date(prestamoDetails.fechaInicio).toLocaleDateString('es-ES') : '-'}</span></div>
                  <div><strong>Fecha Final:</strong> <span style={{ color: '#222' }}>{prestamoDetails.fechaInicio ? (addDaysSkippingSundaysExcludingStart(prestamoDetails.fechaInicio, prestamoDetails.cuotas) ? addDaysSkippingSundaysExcludingStart(prestamoDetails.fechaInicio, prestamoDetails.cuotas)!.toLocaleDateString('es-ES') : '-') : '-'}</span></div>
                  <div><strong>Abono total:</strong> <span style={{ color: '#222' }}>{Number(sumaAbonos || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '')}</span></div>
                  <div><strong>Saldo actual:</strong> <span style={{ color: '#222' }}>{((Number(prestamoDetails.montoPrestado ?? '0') * (1 + Number(prestamoDetails.tasa ?? 0))) - Number(sumaAbonos)).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '')}</span></div>
                  <div><strong>Cuota actual:</strong> <span style={{ color: '#222' }}>{(((Number(prestamoDetails.montoPrestado ?? '0') * (1 + Number(prestamoDetails.tasa ?? 0))) - Number(sumaAbonos)) / (prestamoDetails.cuotas ?? 1)).toLocaleString('es-CO', { maximumFractionDigits: 0 }).replace(/\s/g, '')}</span></div>
                  {(() => {
                    const montoNum = Number(prestamoDetails.montoPrestado ?? '0');
                    const tasaNum = Number(prestamoDetails.tasa ?? 0);
                    const cuotasNum = Number(prestamoDetails.cuotas ?? 1);
                    const totalPagar = montoNum * (1 + tasaNum);
                    const valorCuota = cuotasNum > 0 ? totalPagar / cuotasNum : 0;
                    const actualInstallments = valorCuota > 0 ? Math.floor(Number(sumaAbonos) / valorCuota) : 0;
                    const startDate = prestamoDetails.fechaInicio ? new Date(prestamoDetails.fechaInicio) : null;
                    const todayLocal = new Date();
                    const businessDays = startDate ? businessDaysExcludingSundaysInclusive(startDate, new Date(todayLocal.getFullYear(), todayLocal.getMonth(), todayLocal.getDate())) : 0;
                    const atrasadas = Math.max(0, businessDays - 1 - actualInstallments);
                    const saldoAtrasado = atrasadas * valorCuota;
                    return (
                      <>
                        <div><strong>Cuotas atrasadas:</strong> <span style={{ color: '#222' }}>{atrasadas}</span></div>
                        <div><strong>Valor cuota:</strong> <span style={{ color: '#222' }}>{valorCuota.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '')}</span></div>
                        <div><strong>Saldo atrasado:</strong> <span style={{ color: '#666' }}>{saldoAtrasado > 0 ? saldoAtrasado.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '') : '-'}</span></div>
                      </>
                    );
                  })()}
                  <div><strong>Notas:</strong> <span style={{ color: '#222' }}>{prestamoDetails.notas ?? '-'}</span></div>
                </div>
              ) : (
                <div style={{ color: '#666' }}>Selecciona un préstamo para ver el resumen</div>
              )}
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#222' }}>Último abono registrado</h4>
                {lastAbono ? (
                  <div style={{ color: '#222', lineHeight: 1.6 }}>
                    <div><strong>Cliente:</strong> <span style={{ color: '#222' }}>{lastAbono.prestamo?.cliente?.nombreCompleto || prestamoDetails?.cliente?.nombreCompleto || '-'}</span></div>
                    <div><strong>Código crédito:</strong> <span style={{ color: '#222' }}>#{lastAbono.prestamoId}</span></div>
                    <div><strong>Valor prestado:</strong> <span style={{ color: '#222' }}>{(lastAbono.prestamo?.montoPrestado ? Number(lastAbono.prestamo.montoPrestado) : (prestamoDetails ? Number(prestamoDetails.montoPrestado ?? '0') : 0)).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '')}</span></div>
                    <div><strong>Abono:</strong> <span style={{ color: '#222' }}>{Number(lastAbono.monto).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '')}</span></div>
                    <div><strong>Saldo:</strong> <span style={{ color: '#222' }}>{(((lastAbono.prestamo?.montoPrestado ? Number(lastAbono.prestamo.montoPrestado) : (prestamoDetails ? Number(prestamoDetails.montoPrestado ?? '0') : 0)) * (1 + (lastAbono.prestamo?.tasa ? Number(lastAbono.prestamo.tasa) : (prestamoDetails ? Number(prestamoDetails.tasa ?? 0) : 0)))) - Number(lastAbonoSum || sumaAbonos)).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).replace(/\s/g, '')}</span></div>
                    <div><strong>Fecha:</strong> <span style={{ color: '#222' }}>{lastAbono.fecha ? new Date(lastAbono.fecha).toLocaleDateString("es-CO") : '-'}</span></div>
                  </div>
                ) : (
                  <div style={{ color: '#666' }}>No hay abonos registrados</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

