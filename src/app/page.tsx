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
      <div className="app-bg">
        <Navbar />
        <main className="app-main">
          <div className="spinner-centered">
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '6px solid #e5e7eb', borderTop: '6px solid #0070f3', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userRole = session.user.rol;

  return (
    <div className="app-bg">
      <Navbar />
      <main className="app-main">
        <h1 className="page-title">Dashboard - Sistema de Cobros</h1>

        <div className="dashboard-grid">
          <DashboardCard
            title="Nuevo abono"
            description="Crear un nuevo abono rápidamente"
            href="/abonos/nuevo"
            color="#ef4444"
            cardBackground="#fff1f0"
            titleColor="#111"
            descColor="#333"
          />

          <DashboardCard
            title="Tarjeta virtual"
            description="Ver tarjeta virtual de cliente/prestamo"
            href="/tarjeta-virtual"
            color="#06b6d4"
            cardBackground="#f0f9fb"
            titleColor="#044e54"
            descColor="#0b5257"
          />

          <DashboardCard
            title="Abonos"
            description="Registrar y consultar abonos"
            href="/abonos"
            color="#f59e0b"
          />

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

          <DashboardCard
            title="Reportes"
            description="Acceder a informes y reportes del sistema"
            href="/reports"
            color="#0ea5a0"
          />

          {userRole === 'ADMIN' && (
            <DashboardCard
              title="Caja"
              description="Movimientos de caja"
              href="/caja"
              color="#f97316"
            />
          )}

          <DashboardCard
            title="Usuarios"
            description="Gestionar usuarios del sistema"
            href="/users"
            color="#8b5cf6"
          />
        </div>

        <div className="welcome-card">
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
    <Link href={href} className="dashboard-card" style={{ backgroundColor: cardBackground || 'white' }}>
      <div className="icon" style={{ backgroundColor: color }}>
        {title[0]}
      </div>
      <h3 style={{ marginBottom: '0.5rem', color: titleColor || '#333', fontSize: '1.25rem' }}>
        {title}
      </h3>
      <p style={{ color: descColor || '#666', fontSize: '0.9rem', margin: 0 }}>
        {description}
      </p>
    </Link>
  );
}
