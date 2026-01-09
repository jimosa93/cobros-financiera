'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();

    if (!session) return null;

    const isActive = (path: string) => pathname === path;

    return (
        <nav style={{
            backgroundColor: '#fff',
            borderBottom: '1px solid #e0e0e0',
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            flexWrap: 'wrap',
            gap: '1rem'
        }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <Link href="/" style={{
                    textDecoration: 'none',
                    color: '#333',
                    fontWeight: 'bold',
                    fontSize: '1.25rem',
                    whiteSpace: 'nowrap'
                }}>
                    Sistema de Cobros
                </Link>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <Link href="/" style={{
                        textDecoration: 'none',
                        color: isActive('/') ? '#0070f3' : '#666',
                        fontWeight: isActive('/') ? '600' : '400',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        backgroundColor: isActive('/') ? '#f0f7ff' : 'transparent'
                    }}>
                        Dashboard
                    </Link>

                    <Link href="/clientes" style={{
                        textDecoration: 'none',
                        color: isActive('/clientes') ? '#0070f3' : '#666',
                        fontWeight: isActive('/clientes') ? '600' : '400',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        backgroundColor: isActive('/clientes') ? '#f0f7ff' : 'transparent'
                    }}>
                        Clientes
                    </Link>

                    <Link href="/prestamos" style={{
                        textDecoration: 'none',
                        color: isActive('/prestamos') ? '#0070f3' : '#666',
                        fontWeight: isActive('/prestamos') ? '600' : '400',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        backgroundColor: isActive('/prestamos') ? '#f0f7ff' : 'transparent'
                    }}>
                        Préstamos
                    </Link>

                    <Link href="/abonos" style={{
                        textDecoration: 'none',
                        color: isActive('/abonos') ? '#0070f3' : '#666',
                        fontWeight: isActive('/abonos') ? '600' : '400',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        backgroundColor: isActive('/abonos') ? '#f0f7ff' : 'transparent'
                    }}>
                        Abonos
                    </Link>

                    {session.user.rol === 'ADMIN' && (
                        <>
                            <Link href="/users" style={{
                                textDecoration: 'none',
                                color: isActive('/users') ? '#0070f3' : '#666',
                                fontWeight: isActive('/users') ? '600' : '400',
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                backgroundColor: isActive('/users') ? '#f0f7ff' : 'transparent'
                            }}>
                                Usuarios
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#666', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                    {session.user.name} ({session.user.rol})
                </span>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                    }}
                >
                    Cerrar Sesión
                </button>
            </div>
        </nav>
    );
}
