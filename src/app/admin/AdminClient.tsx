'use client';
import React, { useState } from 'react';
import { Match } from '@/lib/db';
import { login, saveResult } from './actions';
import { PixelButton } from '@/components/PixelButton';

export function AdminClient({ isAdmin, matches }: { isAdmin: boolean, matches: Match[] }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(password);
    if (!success) setError('Contraseña incorrecta');
    else window.location.reload();
    setLoading(false);
  };

  if (!isAdmin) {
    return (
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="pixel-input"
        />
        {error && <div style={{ color: 'var(--error)' }}>{error}</div>}
        <PixelButton type="submit" disabled={loading}>Entrar</PixelButton>
      </form>
    );
  }

  const handleCron = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cron?secret=smcl_cron_secret');
      const data = await res.json();
      alert(data.message || data.error);
      if (res.ok) window.location.reload();
    } catch (e) {
      alert('Error ejecutando cron');
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
        <PixelButton onClick={handleCron} disabled={loading} style={{ backgroundColor: 'var(--success)', borderColor: '#228822' }}>
          Sincronizar con API
        </PixelButton>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="pixel-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Local</th>
            <th>Res</th>
            <th>Visita</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {matches.map(m => (
            <MatchRow key={m.id} match={m} />
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}

function MatchRow({ match }: { match: Match }) {
  const [homeScore, setHomeScore] = useState(match.home_score?.toString() || '');
  const [awayScore, setAwayScore] = useState(match.away_score?.toString() || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const h = parseInt(homeScore);
    const a = parseInt(awayScore);
    if (isNaN(h) || isNaN(a)) return alert('Por favor ingresa números válidos');
    
    setSaving(true);
    try {
      await saveResult(match.id, h, a);
      alert('Guardado!');
    } catch (e) {
      alert('Error al guardar');
    }
    setSaving(false);
  };

  return (
    <tr>
      <td>{match.id}</td>
      <td style={{ textAlign: 'right' }}>{match.home_team} {match.home_flag}</td>
      <td>
        <input 
          type="number" 
          value={homeScore} 
          onChange={e => setHomeScore(e.target.value)} 
          className="pixel-input" 
          style={{ width: '60px', padding: '0.5rem', textAlign: 'center', marginRight: '5px' }} 
        />
        -
        <input 
          type="number" 
          value={awayScore} 
          onChange={e => setAwayScore(e.target.value)} 
          className="pixel-input" 
          style={{ width: '60px', padding: '0.5rem', textAlign: 'center', marginLeft: '5px' }} 
        />
      </td>
      <td style={{ textAlign: 'left' }}>{match.away_flag} {match.away_team}</td>
      <td style={{ color: match.status === 'FINISHED' ? 'var(--success)' : 'inherit' }}>{match.status}</td>
      <td>
        <PixelButton onClick={handleSave} disabled={saving}>Guardar</PixelButton>
      </td>
    </tr>
  );
}
