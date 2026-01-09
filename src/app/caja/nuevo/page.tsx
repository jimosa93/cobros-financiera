'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import FormCard from '@/components/FormCard';
import { Field, ReadonlyInput, Select, Input, Textarea } from '@/components/FormControls';

export default function NuevoCajaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tipo, setTipo] = useState('ENTRADA');
  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);

  const fechaISO = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
  const fechaDisplay = new Date().toLocaleDateString('es-ES'); // dd/mm/yyyy

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.rol !== 'ADMIN') {
      router.replace('/');
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const res = await fetch('/api/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: fechaISO,
          tipo,
          monto: monto === '' ? 0 : Number(monto),
          nota,
        }),
      });
      if (!res.ok) throw new Error('Error creando movimiento');
      router.push('/caja');
    } catch (err) {
      console.error(err);
      alert('Error creando movimiento');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      <FormCard title="Nuevo movimiento de Caja" maxWidth="600px" titleCentered={true}>
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
              {guardando ? 'Guardando…' : 'Crear movimiento'}
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
      </FormCard>
    </div>
  );
}

