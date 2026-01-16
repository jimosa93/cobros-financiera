'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

function NavLinks() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;
    return (
        <>
            <Link href="/" className="nav-link" style={{
                textDecoration: 'none',
                color: isActive('/') ? '#0070f3' : '#666',
                fontWeight: isActive('/') ? '600' : '400',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                backgroundColor: isActive('/') ? '#f0f7ff' : 'transparent'
            }}>
                Dashboard
            </Link>

            <Link href="/clientes" className="nav-link" style={{
                textDecoration: 'none',
                color: isActive('/clientes') ? '#0070f3' : '#666',
                fontWeight: isActive('/clientes') ? '600' : '400',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                backgroundColor: isActive('/clientes') ? '#f0f7ff' : 'transparent'
            }}>
                Clientes
            </Link>

            <Link href="/prestamos" className="nav-link" style={{
                textDecoration: 'none',
                color: isActive('/prestamos') ? '#0070f3' : '#666',
                fontWeight: isActive('/prestamos') ? '600' : '400',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                backgroundColor: isActive('/prestamos') ? '#f0f7ff' : 'transparent'
            }}>
                Préstamos
            </Link>

            <Link href="/abonos" className="nav-link" style={{
                textDecoration: 'none',
                color: isActive('/abonos') ? '#0070f3' : '#666',
                fontWeight: isActive('/abonos') ? '600' : '400',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                backgroundColor: isActive('/abonos') ? '#f0f7ff' : 'transparent'
            }}>
                Abonos
            </Link>
            {session?.user.rol === 'ADMIN' && (
                <Link href="/caja" className="nav-link" style={{
                    textDecoration: 'none',
                    color: isActive('/caja') ? '#0070f3' : '#666',
                    fontWeight: isActive('/caja') ? '600' : '400',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    backgroundColor: isActive('/caja') ? '#f0f7ff' : 'transparent'
                }}>
                    Caja
                </Link>
            )}

            {session?.user.rol === 'ADMIN' && (
                <Link href="/reports" className="nav-link" style={{
                    textDecoration: 'none',
                    color: isActive('/reports') ? '#0070f3' : '#666',
                    fontWeight: isActive('/reports') ? '600' : '400',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    backgroundColor: isActive('/reports') ? '#f0f7ff' : 'transparent'
                }}>
                    Reportes
                </Link>
            )}
            {session?.user.rol === 'ADMIN' && (
                <Link href="/users" className="nav-link" style={{
                    textDecoration: 'none',
                    color: isActive('/users') ? '#0070f3' : '#666',
                    fontWeight: isActive('/users') ? '600' : '400',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    backgroundColor: isActive('/users') ? '#f0f7ff' : 'transparent'
                }}>
                    Usuarios
                </Link>
            )}
        </>
    );
}

export function Navbar() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    if (!session) return null;

    return (
        <nav className="site-nav" style={{
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
            <div className="brand-row" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <Link href="/" style={{
                    textDecoration: 'none',
                    color: '#333',
                    fontWeight: 'bold',
                    fontSize: '1.25rem',
                    whiteSpace: 'nowrap'
                }}>
                    Sistema de Cobros
                </Link>

                <button
                    className="mobile-toggle"
                    aria-expanded={isOpen}
                    aria-controls="mobile-menu"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem'
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
                        <path d="M4 6h16M4 12h16M4 18h16" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <div className="nav-links" style={{ gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <NavLinks />
                </div>
            </div>

            <div className="user-section" style={{ alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#666', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                    {session?.user.name} ({session?.user.rol})
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

            {/* Mobile menu (rendered separately for stacking and easier styling) */}
            <div id="mobile-menu" className={`mobile-menu ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <NavLinks />
                </div>
                <div style={{ height: 1, background: '#efefef', margin: '0.75rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#666', fontSize: '0.95rem' }}>
                        {session?.user.name} ({session?.user.rol})
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        style={{
                            padding: '0.4rem 0.75rem',
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
            </div>
        </nav>
    );
}
