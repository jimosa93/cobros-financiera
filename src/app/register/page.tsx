'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import FormCard from '@/components/FormCard';
import { Field, Input, Select, errorStyle } from '@/components/FormControls';

type PermissionGroup = { label: string; permisos: { value: string; label: string }[] };
type Ruta = { id: number; nombre: string; activo: boolean };

const DEFAULT_PERMISOS = ['CLIENTES_READ', 'PRESTAMOS_READ', 'ABONOS_READ', 'ABONOS_CREATE'];

export default function RegisterPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
    const [formData, setFormData] = useState({
        nombreCompleto: '',
        celular: '',
        email: '',
        password: '',
        alias: '',
        rol: 'USUARIO' as 'ADMIN' | 'USUARIO',
        placaMoto: '',
        fechaTecnico: '',
        fechaSoat: '',
    });
    const [permisos, setPermisos] = useState<string[]>(DEFAULT_PERMISOS);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [rutas, setRutas] = useState<Ruta[]>([]);
    const [rutaIds, setRutaIds] = useState<number[]>([]);

    useEffect(() => {
        fetch('/api/permissions')
            .then((r) => r.json())
            .then((data) => data.groups && setPermissionGroups(data.groups))
            .catch(() => { });
        fetch('/api/rutas')
            .then((r) => r.json())
            .then((data) => data.rutas && setRutas(data.rutas))
            .catch(() => { });
    }, []);

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
                    permisos: formData.rol === 'USUARIO' ? permisos : [],
                    rutaIds: formData.rol === 'USUARIO' ? rutaIds : [],
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
                    rol: 'USUARIO',
                    placaMoto: '',
                    fechaTecnico: '',
                    fechaSoat: '',
                });
                setPermisos(DEFAULT_PERMISOS);
                setRutaIds([]);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    const togglePermiso = (value: string) => {
        setPermisos((prev) =>
            prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
        );
    };

    const toggleRuta = (rutaId: number) => {
        setRutaIds((prev) => (
            prev.includes(rutaId) ? prev.filter((id) => id !== rutaId) : [...prev, rutaId]
        ));
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
                            <option value="USUARIO">Usuario</option>
                            <option value="ADMIN">Administrador</option>
                        </Select>
                    </Field>
                    {formData.rol === 'USUARIO' && permissionGroups.length > 0 && (
                        <Field label="Permisos">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '12px 0' }}>
                                {permissionGroups.map((group) => (
                                    <div key={group.label} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, background: '#fafafa' }}>
                                        <div style={{ fontWeight: 600, marginBottom: 8, color: '#333' }}>{group.label}</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                            {group.permisos.map((p) => (
                                                <label key={p.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, color: '#232323' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={permisos.includes(p.value)}
                                                        onChange={() => togglePermiso(p.value)}
                                                    />
                                                    <span style={{ color: '#232323' }}>{p.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Field>
                    )}
                    {formData.rol === 'USUARIO' && (
                        <Field label="Rutas asignadas">
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '12px 0' }}>
                                {rutas.map((ruta) => (
                                    <label key={ruta.id} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#232323' }}>
                                        <input
                                            type="checkbox"
                                            checked={rutaIds.includes(ruta.id)}
                                            onChange={() => toggleRuta(ruta.id)}
                                        />
                                        <span>{ruta.nombre} {!ruta.activo && '(Inactiva)'}</span>
                                    </label>
                                ))}
                            </div>
                        </Field>
                    )}
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
