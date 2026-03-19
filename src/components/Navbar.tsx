'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useRuta } from '@/contexts/RutaContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import Image from 'next/image';

function NavLinks() {
    const { data: session } = useSession();
    const { can } = usePermissions();
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;
    return (
        <>
            <Link href="/" className="nav-link" style={{
                textDecoration: 'none',
                color: isActive('/') ? '#0070f3' : '#666',
                fontWeight: isActive('/') ? '600' : '400',
                padding: '0.5rem',
                borderRadius: '4px',
                backgroundColor: isActive('/') ? '#f0f7ff' : 'transparent'
            }}>
                Dashboard
            </Link>

            {can('CLIENTES_READ') && (
                <Link href="/clientes" className="nav-link" style={{
                    textDecoration: 'none',
                    color: isActive('/clientes') ? '#0070f3' : '#666',
                    fontWeight: isActive('/clientes') ? '600' : '400',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    backgroundColor: isActive('/clientes') ? '#f0f7ff' : 'transparent'
                }}>
                    Clientes
                </Link>
            )}

            {can('PRESTAMOS_READ') && (
                <Link href="/prestamos" className="nav-link" style={{
                    textDecoration: 'none',
                    color: isActive('/prestamos') ? '#0070f3' : '#666',
                    fontWeight: isActive('/prestamos') ? '600' : '400',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    backgroundColor: isActive('/prestamos') ? '#f0f7ff' : 'transparent'
                }}>
                    Préstamos
                </Link>
            )}

            {can('ABONOS_READ') && (
                <Link href="/abonos" className="nav-link" style={{
                    textDecoration: 'none',
                    color: isActive('/abonos') ? '#0070f3' : '#666',
                    fontWeight: isActive('/abonos') ? '600' : '400',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    backgroundColor: isActive('/abonos') ? '#f0f7ff' : 'transparent'
                }}>
                    Abonos
                </Link>
            )}
            {can('CAJA_READ', 'CAJA_CREATE', 'CAJA_UPDATE', 'CAJA_DELETE') && (
                <Link href="/caja" className="nav-link" style={{
                    textDecoration: 'none',
                    color: isActive('/caja') ? '#0070f3' : '#666',
                    fontWeight: isActive('/caja') ? '600' : '400',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    backgroundColor: isActive('/caja') ? '#f0f7ff' : 'transparent'
                }}>
                    Caja
                </Link>
            )}

            {can('REPORTES_VIEW') && (
                <Link href="/reports" className="nav-link" style={{
                    textDecoration: 'none',
                    color: isActive('/reports') ? '#0070f3' : '#666',
                    fontWeight: isActive('/reports') ? '600' : '400',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    backgroundColor: isActive('/reports') ? '#f0f7ff' : 'transparent'
                }}>
                    Reportes
                </Link>
            )}
            {can('RUTAS_READ', 'RUTAS_CREATE', 'RUTAS_UPDATE', 'RUTAS_DELETE') && (
                <Link href="/rutas" className="nav-link" style={{
                    textDecoration: 'none',
                    color: isActive('/rutas') || pathname?.startsWith('/rutas/') ? '#0070f3' : '#666',
                    fontWeight: isActive('/rutas') || pathname?.startsWith('/rutas/') ? '600' : '400',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    backgroundColor: isActive('/rutas') || pathname?.startsWith('/rutas/') ? '#f0f7ff' : 'transparent'
                }}>
                    Rutas
                </Link>
            )}
            {session?.user.rol === 'ADMIN' && (
                <Link href="/users" className="nav-link" style={{
                    textDecoration: 'none',
                    color: isActive('/users') ? '#0070f3' : '#666',
                    fontWeight: isActive('/users') ? '600' : '400',
                    padding: '0.5rem',
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
    const { rutaSeleccionada, setRutaSeleccionada, rutas, loadingRutas } = useRuta();
    if (!session) return null;

    const showRutaSelector = !loadingRutas && rutas.length >= 2;
    const showSingleRutaBadge = !loadingRutas && rutas.length === 1;
    const singleRuta = showSingleRutaBadge ? rutas[0] : null;

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
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    <div style={{ height: 40, overflow: 'hidden', display: 'inline-flex', alignItems: 'center' }}>
                        <Image
                            src="/logo-impulso.png"
                            alt="ImpulsoCapital"
                            width={168}
                            height={40}
                            loading="eager"
                        />
                    </div>
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

                <div className="nav-links" style={{ gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <NavLinks />
                </div>
            </div>

            <div className="user-section" style={{ alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {showRutaSelector && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ color: '#666', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                            Ruta:
                        </label>
                        <select
                            value={rutaSeleccionada || ''}
                            onChange={(e) => setRutaSeleccionada(e.target.value ? parseInt(e.target.value) : null)}
                            style={{
                                padding: '0.4rem 0.6rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                backgroundColor: rutaSeleccionada ? '#e3f2fd' : 'white',
                                color: '#333',
                                cursor: 'pointer',
                                fontWeight: rutaSeleccionada ? '600' : '400'
                            }}
                        >
                            <option value="">Todas las rutas</option>
                            {rutas.map((ruta) => (
                                <option key={ruta.id} value={ruta.id}>
                                    {ruta.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                {showSingleRutaBadge && singleRuta && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.35rem 0.6rem',
                            borderRadius: '999px',
                            backgroundColor: '#f0f7ff',
                            border: '1px solid #cfe3ff',
                            color: '#1f4f8c',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                        }}
                        title="Ruta activa asignada al usuario"
                    >
                        <span style={{ fontWeight: 500, color: '#4a617b' }}>Ruta activa:</span>
                        <span>{singleRuta.nombre}</span>
                    </div>
                )}
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
                {showRutaSelector && (
                    <>
                        <div style={{ marginBottom: '0.75rem' }}>
                            <label style={{ display: 'block', color: '#666', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                Filtrar por Ruta:
                            </label>
                            <select
                                value={rutaSeleccionada || ''}
                                onChange={(e) => setRutaSeleccionada(e.target.value ? parseInt(e.target.value) : null)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '0.9rem',
                                    backgroundColor: rutaSeleccionada ? '#e3f2fd' : 'white',
                                    color: '#333',
                                    cursor: 'pointer',
                                    fontWeight: rutaSeleccionada ? '600' : '400'
                                }}
                            >
                                <option value="">Todas las rutas</option>
                                {rutas.map((ruta) => (
                                    <option key={ruta.id} value={ruta.id}>
                                        {ruta.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ height: 1, background: '#efefef', margin: '0.75rem 0' }} />
                    </>
                )}
                {showSingleRutaBadge && singleRuta && (
                    <>
                        <div
                            style={{
                                marginBottom: '0.75rem',
                                padding: '0.5rem 0.65rem',
                                borderRadius: '8px',
                                backgroundColor: '#f0f7ff',
                                border: '1px solid #cfe3ff',
                                color: '#1f4f8c',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                            }}
                        >
                            <span style={{ fontWeight: 500, color: '#4a617b' }}>Ruta activa: </span>
                            <span>{singleRuta.nombre}</span>
                        </div>
                        <div style={{ height: 1, background: '#efefef', margin: '0.75rem 0' }} />
                    </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
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
