import React from 'react';
import Link from 'next/link';
import { getParticipantById, getParticipantPredictionsWithMatches } from '@/lib/db';
import { PixelCard } from '@/components/PixelCard';

export const dynamic = 'force-dynamic';

export default async function ParticipantPage({ params }: { params: Promise<{ id: string }> }) {
  // In Next.js 15, params is a Promise that needs to be awaited
  const { id } = await params;
  const participantId = parseInt(id, 10);
  const participant = getParticipantById(participantId);

  if (!participant) {
    return (
      <main className="container">
        <PixelCard title="No encontrado">
          <p>El participante no existe.</p>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link href="/" style={{ color: 'var(--blue-400)' }}>[ Volver al Dashboard ]</Link>
          </div>
        </PixelCard>
      </main>
    );
  }

  const predictions = getParticipantPredictionsWithMatches(participantId);

  return (
    <main className="container">
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ color: 'var(--blue-400)' }}>&larr; Volver al Dashboard</Link>
      </div>
      
      <PixelCard title={`Predicciones de ${participant.name}`}>
        <div style={{ overflowX: 'auto' }}>
          <table className="pixel-table">
            <thead>
              <tr>
                <th>#</th>
                <th style={{ textAlign: 'right' }}>Local</th>
                <th>Predicción</th>
                <th style={{ textAlign: 'left' }}>Visita</th>
                <th>Resultado Real</th>
                <th>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td style={{ textAlign: 'right' }}>{p.home_team} {p.home_flag}</td>
                  <td style={{ color: 'var(--blue-200)' }}>
                    {p.pred_home_score} - {p.pred_away_score}
                  </td>
                  <td style={{ textAlign: 'left' }}>{p.away_flag} {p.away_team}</td>
                  <td>
                    {p.status === 'FINISHED' ? `${p.home_score} - ${p.away_score}` : '-'}
                  </td>
                  <td style={{ 
                    color: p.pointsEarned === 3 ? 'var(--success)' : 
                           p.pointsEarned === 1 ? 'var(--blue-400)' : 'inherit' 
                  }}>
                    {p.status === 'FINISHED' ? `+${p.pointsEarned}` : '-'}
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
