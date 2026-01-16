'use client';

import { useState, useEffect } from 'react';
import { Field, Input } from '@/components/FormControls';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

interface ClienteFormData {
    nombreCompleto: string;
    celular: string;
    direccionNegocio: string;
    direccionVivienda: string;
}

interface ClienteFormProps {
    clienteId?: number;
    initialData?: ClienteFormData;
}

export default function ClienteForm({ clienteId, initialData }: ClienteFormProps) {
    const router = useRouter();
    const toast = useToast();
    const [formData, setFormData] = useState<ClienteFormData>({
        nombreCompleto: initialData?.nombreCompleto || '',
        celular: initialData?.celular || '',
        direccionNegocio: initialData?.direccionNegocio || '',
        direccionVivienda: initialData?.direccionVivienda || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loadingInitial, setLoadingInitial] = useState(!!clienteId);

    useEffect(() => {
        if (clienteId) {
            fetchCliente();
        }
    }, [clienteId]);

    const fetchCliente = async () => {
        try {
            const response = await fetch(`/api/clientes/${clienteId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al cargar cliente');
            }

            setFormData({
                nombreCompleto: data.cliente.nombreCompleto,
                celular: data.cliente.celular,
                direccionNegocio: data.cliente.direccionNegocio || '',
                direccionVivienda: data.cliente.direccionVivienda || '',
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar cliente');
        } finally {
            setLoadingInitial(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const url = clienteId ? `/api/clientes/${clienteId}` : '/api/clientes';
            const method = clienteId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nombreCompleto: formData.nombreCompleto,
                    celular: formData.celular,
                    direccionNegocio: formData.direccionNegocio || null,
                    direccionVivienda: formData.direccionVivienda || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Error al ${clienteId ? 'actualizar' : 'crear'} cliente`);
            }

            try { toast.addToast({ message: clienteId ? 'Cliente actualizado' : 'Cliente creado', type: 'success' }); } catch (e) { }
            router.push('/clientes');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : `Error al ${clienteId ? 'actualizar' : 'crear'} cliente`);
        } finally {
            setLoading(false);
        }
    };

    if (loadingInitial) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', border: '6px solid #e5e7eb', borderTop: '6px solid #0070f3', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <form onSubmit={handleSubmit}>
                <Field label="Nombre Completo *">
                    <Input id="nombreCompleto" name="nombreCompleto" type="text" value={formData.nombreCompleto} onChange={handleChange} required placeholder="Ej: Juan Pérez" />
                </Field>

                <Field label="Celular *">
                    <Input id="celular" name="celular" type="tel" value={formData.celular} onChange={handleChange} required placeholder="Ej: 3001234567" />
                </Field>

                <Field label="Dirección Negocio">
                    <Input id="direccionNegocio" name="direccionNegocio" type="text" value={formData.direccionNegocio} onChange={handleChange} placeholder="Ej: Calle 123 # 45-6" />
                </Field>

                <Field label="Dirección Vivienda">
                    <Input id="direccionVivienda" name="direccionVivienda" type="text" value={formData.direccionVivienda} onChange={handleChange} placeholder="Ej: Cra 10 # 20-30" />
                </Field>

                {error && (
                    <div style={{
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        backgroundColor: '#fee',
                        color: '#c33',
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ marginTop: '2rem' }}>
                    <button type="submit" disabled={loading} style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: loading ? '#999' : '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: '500'
                    }}>
                        {loading ? 'Guardando...' : clienteId ? 'Actualizar' : 'Crear Cliente'}
                    </button>
                    <button type="button" onClick={() => router.push('/clientes')} disabled={loading} style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem', background: 'white', color: '#0070f3', border: '1px solid #0070f3', borderRadius: 4 }}>Cancelar</button>
                </div>
            </form>
        </div>
    );
}
