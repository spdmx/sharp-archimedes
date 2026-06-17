import React from 'react';
import Link from 'next/link';

type ParticipantScore = {
  id: number;
  name: string;
  points: number;
  exactMatches: number;
  winnerMatches: number;
};

export function Leaderboard({ data }: { data: ParticipantScore[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="pixel-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Participante</th>
            <th>Pts</th>
            <th>Exactos</th>
            <th>Ganadores</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, index) => (
            <tr key={p.id}>
              <td>{index + 1}</td>
              <td style={{ textAlign: 'left' }}>
                <Link href={`/participant/${p.id}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                  {p.name}
                </Link>
              </td>
              <td style={{ color: 'var(--success)' }}>{p.points}</td>
              <td>{p.exactMatches}</td>
              <td>{p.winnerMatches}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={5}>No hay datos aún.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
