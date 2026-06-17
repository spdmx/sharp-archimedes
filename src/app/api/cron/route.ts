import { NextResponse } from 'next/server';
import { getMatches, updateMatchResult } from '@/lib/db';

const TEAM_MAP: Record<string, string> = {
  'GER': 'Alemania',
  'KSA': 'Arabia Saudita',
  'ALG': 'Argelia',
  'ARG': 'Argentina',
  'AUS': 'Australia',
  'AUT': 'Austria',
  'BIH': 'Bosnia y Herzegovina',
  'BRA': 'Brasil',
  'BEL': 'Bélgica',
  'CPV': 'Cabo Verde',
  'CAN': 'Canadá',
  'QAT': 'Catar',
  'COL': 'Colombia',
  'KOR': 'Corea del Sur',
  'CIV': 'Costa de Marfil',
  'CRO': 'Croacia',
  'CUW': 'Curazao',
  'ECU': 'Ecuador',
  'EGY': 'Egipto',
  'SCO': 'Escocia',
  'ESP': 'España',
  'USA': 'Estados Unidos',
  'FRA': 'Francia',
  'GHA': 'Ghana',
  'HAI': 'Haití',
  'ENG': 'Inglaterra',
  'IRQ': 'Irak',
  'IRN': 'Irán',
  'JPN': 'Japón',
  'JOR': 'Jordania',
  'MAR': 'Marruecos',
  'MEX': 'México',
  'NOR': 'Noruega',
  'NZL': 'Nueva Zelanda',
  'PAN': 'Panamá',
  'PAR': 'Paraguay',
  'NED': 'Países Bajos',
  'POR': 'Portugal',
  'COD': 'RD Congo',
  'CZE': 'República Checa',
  'SEN': 'Senegal',
  'RSA': 'Sudáfrica',
  'SWE': 'Suecia',
  'SUI': 'Suiza',
  'TUR': 'Turquía',
  'TUN': 'Túnez',
  'URU': 'Uruguay',
  'UZB': 'Uzbekistán'
};

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedAuth = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');
  const expectedQuery = process.env.CRON_SECRET || 'smcl_cron_secret';
  
  if (
    !(expectedAuth && authHeader === expectedAuth) &&
    querySecret !== expectedQuery
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const matches = (await getMatches()).filter(m => m.status === 'PENDING');
    if (matches.length === 0) {
      return NextResponse.json({ message: 'No pending matches to update' });
    }

    const token = process.env.FOOTBALL_API_KEY || '8107b8d1a22349c9b5d6521c9ba1946d';
    const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED', {
      headers: { 'X-Auth-Token': token }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    let updatedCount = 0;
    
    if (data.matches && Array.isArray(data.matches)) {
      for (const apiMatch of data.matches) {
        const apiHome = TEAM_MAP[apiMatch.homeTeam.tla];
        const apiAway = TEAM_MAP[apiMatch.awayTeam.tla];
        
        if (!apiHome || !apiAway) continue;
        
        // Find matching pending match in our DB
        const pendingMatch = matches.find(m => 
          m.home_team === apiHome && m.away_team === apiAway
        );
        
        if (pendingMatch && apiMatch.score && apiMatch.score.fullTime) {
          const homeScore = apiMatch.score.fullTime.home;
          const awayScore = apiMatch.score.fullTime.away;
          
          if (typeof homeScore === 'number' && typeof awayScore === 'number') {
            await updateMatchResult(pendingMatch.id, homeScore, awayScore);
            updatedCount++;
          }
        }
      }
    }

    return NextResponse.json({ message: `Cron ejecutado. Partidos actualizados: ${updatedCount}` });
  } catch (error: any) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
