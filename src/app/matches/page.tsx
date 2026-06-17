import React from 'react';
import Link from 'next/link';
import { getMatches } from '@/lib/db';
import { PixelCard } from '@/components/PixelCard';

export const dynamic = 'force-dynamic';

export default function MatchesPage() {
  const matches = getMatches();

  return (
    <main className="container">
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ color: 'var(--blue-400)' }}>&larr; Volver al Dashboard</Link>
      </div>
      
      <PixelCard title="Resultados de los Partidos">
        <div style={{ overflowX: 'auto' }}>
          <table className="pixel-table">
            <thead>
              <tr>
                <th>#</th>
                <th style={{ textAlign: 'right' }}>Local</th>
                <th>Marcador</th>
                <th style={{ textAlign: 'left' }}>Visita</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {matches.map(m => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td style={{ textAlign: 'right' }}>{m.home_team} {m.home_flag}</td>
                  <td style={{ color: 'var(--success)' }}>
                    {m.status === 'FINISHED' ? `${m.home_score} - ${m.away_score}` : '-'}
                  </td>
                  <td style={{ textAlign: 'left' }}>{m.away_flag} {m.away_team}</td>
                  <td style={{ color: m.status === 'FINISHED' ? 'var(--blue-400)' : 'inherit' }}>
                    {m.status === 'FINISHED' ? 'Finalizado' : 'Pendiente'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PixelCard>
    </main>
  );
}
