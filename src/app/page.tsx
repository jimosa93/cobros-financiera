'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '6px solid #e5e7eb', borderTop: '6px solid #0070f3', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userRole = session.user.rol;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Navbar />
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '2rem', color: '#333' }}>
          Dashboard - Sistema de Cobros
        </h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Nuevo abono first and highlighted */}
          <DashboardCard
            title="Nuevo abono"
            description="Crear un nuevo abono rápidamente"
            href="/abonos/nuevo"
            color="#ef4444"
            cardBackground="#fff1f0"
            titleColor="#111"
            descColor="#333"
          />

          {/* Abonos second */}
          <DashboardCard
            title="Abonos"
            description="Registrar y consultar abonos"
            href="/abonos"
            color="#f59e0b"
          />

          {/* Clientes third */}
          <DashboardCard
            title="Clientes"
            description="Gestionar clientes del sistema"
            href="/clientes"
            color="#0070f3"
          />

          <DashboardCard
            title="Préstamos"
            description="Ver y gestionar préstamos"
            href="/prestamos"
            color="#10b981"
          />

          {userRole === 'ADMIN' && (
            <>
              <DashboardCard
                title="Usuarios"
                description="Gestionar usuarios del sistema"
                href="/users"
                color="#8b5cf6"
              />
            </>
          )}
          {userRole === 'ADMIN' && (
            <DashboardCard
              title="Caja"
              description="Movimientos de caja"
              href="/caja"
              color="#f97316"
            />
          )}
          {/* Tarjeta virtual - visible to all users */}
          <DashboardCard
            title="Tarjeta virtual"
            description="Ver tarjeta virtual de cliente/prestamo"
            href="/tarjeta-virtual"
            color="#06b6d4"
            cardBackground="#f0f9fb"
            titleColor="#044e54"
            descColor="#0b5257"
          />
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '1rem', color: '#333' }}>
            Bienvenido, {session.user.name}
          </h2>
          <p style={{ color: '#666', marginBottom: '0.5rem' }}>
            Rol: <strong>{userRole}</strong>
          </p>
          <p style={{ color: '#666', marginBottom: '0.5rem' }}>
            Email: <strong>{session.user.email}</strong>
          </p>
          {userRole === 'ADMIN' && (
            <p style={{ color: '#666' }}>
              Tienes acceso completo al sistema para gestionar clientes, préstamos, abonos y usuarios.
            </p>
          )}
          {userRole === 'COBRADOR' && (
            <p style={{ color: '#666' }}>
              Puedes registrar abonos y consultar información de tus clientes asignados.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
  color,
  cardBackground,
  titleColor,
  descColor
}: {
  title: string;
  description: string;
  href: string;
  color: string;
  cardBackground?: string;
  titleColor?: string;
  descColor?: string;
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: 'none',
        display: 'block',
        backgroundColor: cardBackground || 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '8px',
        backgroundColor: color,
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        {title[0]}
      </div>
      <h3 style={{
        marginBottom: '0.5rem',
        color: titleColor || '#333',
        fontSize: '1.25rem'
      }}>
        {title}
      </h3>
      <p style={{
        color: descColor || '#666',
        fontSize: '0.9rem',
        margin: 0
      }}>
        {description}
      </p>
    </Link>
  );
}
