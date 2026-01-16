'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import FormCard from '@/components/FormCard';
import { Field, Input, Select, errorStyle } from '@/components/FormControls';

export default function RegisterPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [formData, setFormData] = useState({
        nombreCompleto: '',
        celular: '',
        email: '',
        password: '',
        alias: '',
        rol: 'COBRADOR' as 'ADMIN' | 'COBRADOR',
        placaMoto: '',
        fechaTecnico: '',
        fechaSoat: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!session || session.user.rol !== 'ADMIN') {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#f5f5f5'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }}>
                    <h2>Acceso denegado</h2>
                    <p>Solo los administradores pueden crear usuarios.</p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    fechaTecnico: formData.fechaTecnico || null,
                    fechaSoat: formData.fechaSoat || null,
                    alias: formData.alias || null,
                    placaMoto: formData.placaMoto || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Error al crear usuario');
            } else {
                setSuccess(true);
                setFormData({
                    nombreCompleto: '',
                    celular: '',
                    email: '',
                    password: '',
                    alias: '',
                    rol: 'COBRADOR',
                    placaMoto: '',
                    fechaTecnico: '',
                    fechaSoat: '',
                });
                try { sessionStorage.setItem('globalToast', JSON.stringify({ message: 'Usuario creado', type: 'success' })); window.dispatchEvent(new Event('global-toast')); } catch (e) { }
                router.push('/users');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            setError('Ocurrió un error al crear el usuario');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <Navbar />
            <FormCard title="Crear Nuevo Usuario" maxWidth="600px" titleCentered={true}>
                <form onSubmit={handleSubmit}>
                    <Field label="Nombre Completo *">
                        <Input name="nombreCompleto" type="text" value={formData.nombreCompleto} onChange={handleChange} required />
                    </Field>
                    <Field label="Celular *">
                        <Input name="celular" type="tel" value={formData.celular} onChange={handleChange} required />
                    </Field>
                    <Field label="Email *">
                        <Input name="email" type="email" value={formData.email} onChange={handleChange} required />
                    </Field>
                    <Field label="Contraseña *">
                        <Input name="password" type="password" value={formData.password} onChange={handleChange} required />
                    </Field>
                    <Field label="Rol *">
                        <Select name="rol" value={formData.rol} onChange={handleChange} required>
                            <option value="COBRADOR">Cobrador</option>
                            <option value="ADMIN">Administrador</option>
                        </Select>
                    </Field>
                    <Field label="Alias">
                        <Input name="alias" type="text" value={formData.alias} onChange={handleChange} />
                    </Field>
                    <Field label="Placa Moto">
                        <Input name="placaMoto" type="text" value={formData.placaMoto} onChange={handleChange} />
                    </Field>
                    <Field label="Fecha Técnico">
                        <Input name="fechaTecnico" type="date" value={formData.fechaTecnico} onChange={handleChange} />
                    </Field>
                    <Field label="Fecha SOAT">
                        <Input name="fechaSoat" type="date" value={formData.fechaSoat} onChange={handleChange} />
                    </Field>
                    {error && <div style={errorStyle}>{error}</div>}
                    {success && <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#efe', color: '#3c3', borderRadius: 4, fontSize: '0.9rem' }}>{success}</div>}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: loading ? '#999' : '#0070f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        {loading ? 'Creando usuario...' : 'Crear Usuario'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push('/users')}
                        disabled={loading}
                        style={{
                            width: '100%',
                            marginTop: '0.75rem',
                            padding: '0.75rem',
                            backgroundColor: 'white',
                            color: '#0070f3',
                            border: '1px solid #0070f3',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        Cancelar
                    </button>
                </form>
            </FormCard>
        </div>
    );
}
