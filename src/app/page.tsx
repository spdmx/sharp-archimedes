import React from 'react';
import Link from 'next/link';
import { calculateLeaderboard } from '@/lib/db';
import { Leaderboard } from '@/components/Leaderboard';
import { PixelCard } from '@/components/PixelCard';

// Opt out of static rendering so the DB is queried on every request
export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = calculateLeaderboard();

  return (
    <main className="container">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆 SMCL 2026</h1>
        <p style={{ color: 'var(--blue-200)' }}>Quiniela Mundialista</p>
      </div>
      
      <PixelCard title="Posiciones">
        <Leaderboard data={data} />
      </PixelCard>
      
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link href="/matches" className="pixel-button" style={{ display: 'inline-block', marginBottom: '1rem', color: 'var(--white)' }}>
          Ver Partidos
        </Link>
        <br />
        <Link href="/admin" style={{ fontSize: '0.8rem', color: 'var(--blue-400)' }}>
          [ Área de Administrador ]
        </Link>
      </div>
    </main>
  );
}
