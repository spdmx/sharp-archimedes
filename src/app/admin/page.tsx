import React from 'react';
import { cookies } from 'next/headers';
import { getMatches } from '@/lib/db';
import { AdminClient } from './AdminClient';
import { PixelCard } from '@/components/PixelCard';
import { PixelButton } from '@/components/PixelButton';
import { logout } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('admin')?.value === 'true';

  if (!isAdmin) {
    return (
      <main className="container">
        <PixelCard title="Acceso de Administrador">
          <AdminClient isAdmin={false} matches={[]} />
        </PixelCard>
      </main>
    );
  }

  const matches = getMatches();

  return (
    <main className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Panel de Control</h2>
        <form action={logout}>
          <PixelButton type="submit">Salir</PixelButton>
        </form>
      </div>

      <PixelCard title="Actualizar Partidos">
        <AdminClient isAdmin={true} matches={matches} />
      </PixelCard>
      
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <a href="/" style={{ fontSize: '0.8rem', color: 'var(--blue-400)' }}>[ Volver al Dashboard ]</a>
      </div>
    </main>
  );
}
