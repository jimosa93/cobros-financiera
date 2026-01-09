'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/Navbar';
import FormCard from '@/components/FormCard';
import { Field, ReadonlyInput, Select, Input, Textarea } from '@/components/FormControls';

export default function EditCajaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [tipo, setTipo] = useState('ENTRADA');
  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');
  const [fechaDisplay, setFechaDisplay] = useState('');
  const [fechaISO, setFechaISO] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.rol !== 'ADMIN') {
      router.replace('/');
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = `/api/caja?id=${encodeURIComponent(String(id))}`;
        const res = await fetch(url);
        if (!res.ok) {
          const txt = await res.text();
          console.error('Error fetching caja item:', res.status, txt);
          setLoading(false);
          return;
        }
        const d = await res.json();
        let item = d?.caja;
        // API may return the item directly or inside an array; normalize to single object
        if (Array.isArray(item)) item = item[0];
        if (!item) {
          console.warn('Caja item not found for id', id);
          setLoading(false);
          return;
        }
        setTipo(item.tipo);
        setMonto(String(item.monto));
        setNota(item.nota || '');
        const date = new Date(item.fecha);
        if (!isNaN(date.getTime())) {
          setFechaISO(date.toISOString().substring(0, 10));
          setFechaDisplay(date.toLocaleDateString('es-ES'));
        } else {
          setFechaISO('');
          setFechaDisplay('');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const res = await fetch('/api/caja/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          fecha: fechaISO,
          tipo,
          monto: monto === '' ? 0 : Number(monto),
          nota,
        }),
      });
      if (!res.ok) throw new Error('Error actualizando');
      try { sessionStorage.setItem('globalToast', JSON.stringify({ message: 'Movimiento actualizado', type: 'success' })); } catch (e) {}
      router.push('/caja');
    } catch (e) {
      console.error(e);
      alert('Error actualizando movimiento');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      <FormCard title="Editar movimiento de Caja" maxWidth="600px" titleCentered={true}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Field label="Fecha">
              <ReadonlyInput value={fechaDisplay} type="text" />
            </Field>

            <Field label="Tipo *">
              <Select value={tipo} onChange={(e) => setTipo(e.target.value)} required>
                <option value="GASTO">GASTO</option>
                <option value="ENTRADA">ENTRADA</option>
                <option value="SALIDA">SALIDA</option>
                <option value="SALIDA_RUTA">SALIDA_RUTA</option>
                <option value="ENTRADA_RUTA">ENTRADA_RUTA</option>
              </Select>
            </Field>

            <Field label="Monto *">
              <Input value={monto} onChange={(e) => setMonto(e.target.value.replace(/[^\d.]/g, ''))} type="number" min={0} required />
            </Field>

            <Field label="Nota">
              <Textarea value={nota} onChange={(e) => setNota(e.target.value)} />
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
                {guardando ? 'Guardando…' : 'Actualizar movimiento'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/caja')}
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
          </form>
        )}
      </FormCard>
    </div>
  );
}

