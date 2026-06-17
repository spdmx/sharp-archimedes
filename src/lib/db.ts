import { createClient } from '@libsql/client/web';

// Using a singleton pattern to ensure only one connection is open
let client: ReturnType<typeof createClient> | null = null;

export function getClient() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    
    // In Vercel or production environment, we MUST use Turso cloud database
    const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    if (isVercel && !url) {
      throw new Error(
        'Critical Configuration Error: TURSO_DATABASE_URL environment variable is missing. ' +
        'Local SQLite file database cannot be written to on Vercel (read-only filesystem).'
      );
    }
    
    client = createClient({ 
      url: url || 'file:quiniela.db', 
      authToken 
    });
  }
  return client;
}

export type Participant = {
  id: number;
  name: string;
};

export type Match = {
  id: number;
  home_team: string;
  home_flag: string;
  away_team: string;
  away_flag: string;
  status: 'PENDING' | 'FINISHED';
  home_score: number | null;
  away_score: number | null;
};

export type Prediction = {
  participant_id: number;
  match_id: number;
  home_score: number;
  away_score: number;
};

export async function getParticipants(): Promise<Participant[]> {
  const rs = await getClient().execute('SELECT * FROM participants');
  return rs.rows as unknown as Participant[];
}

export async function getMatches(): Promise<Match[]> {
  const rs = await getClient().execute('SELECT * FROM matches ORDER BY id ASC');
  return rs.rows as unknown as Match[];
}

export async function getPredictions(): Promise<Prediction[]> {
  const rs = await getClient().execute('SELECT * FROM predictions');
  return rs.rows as unknown as Prediction[];
}

export async function getParticipantById(id: number): Promise<Participant | undefined> {
  const rs = await getClient().execute({
    sql: 'SELECT * FROM participants WHERE id = ?',
    args: [id]
  });
  return rs.rows[0] as unknown as Participant | undefined;
}

export type PredictionWithMatch = Match & {
  pred_home_score: number;
  pred_away_score: number;
  pointsEarned: number;
};

export async function getParticipantPredictionsWithMatches(participantId: number): Promise<PredictionWithMatch[]> {
  const matches = await getMatches();
  const rs = await getClient().execute({
    sql: 'SELECT * FROM predictions WHERE participant_id = ?',
    args: [participantId]
  });
  const predictions = rs.rows as unknown as Prediction[];
  
  return predictions.map(pred => {
    const match = matches.find(m => m.id === pred.match_id)!;
    let pointsEarned = 0;
    
    if (match.status === 'FINISHED' && match.home_score !== null && match.away_score !== null) {
      const actualHome = match.home_score;
      const actualAway = match.away_score;
      const actualDiff = actualHome - actualAway;
      const actualSign = actualDiff > 0 ? 1 : actualDiff < 0 ? -1 : 0;
      
      const predDiff = pred.home_score - pred.away_score;
      const predSign = predDiff > 0 ? 1 : predDiff < 0 ? -1 : 0;
      
      if (pred.home_score === actualHome && pred.away_score === actualAway) {
        pointsEarned = 3;
      } else if (predSign === actualSign) {
        pointsEarned = 1;
      }
    }
    
    return { 
      ...match, 
      pred_home_score: pred.home_score, 
      pred_away_score: pred.away_score, 
      pointsEarned 
    };
  });
}

export async function updateMatchResult(matchId: number, homeScore: number, awayScore: number) {
  await getClient().execute({
    sql: 'UPDATE matches SET home_score = ?, away_score = ?, status = ? WHERE id = ?',
    args: [homeScore, awayScore, 'FINISHED', matchId]
  });
}

// Logic for calculating points
export async function calculateLeaderboard() {
  const participants = await getParticipants();
  const matches = (await getMatches()).filter(m => m.status === 'FINISHED' && m.home_score !== null && m.away_score !== null);
  const predictions = await getPredictions();

  // Initialize leaderboard
  const leaderboard = participants.map(p => ({
    id: p.id,
    name: p.name,
    points: 0,
    exactMatches: 0,
    winnerMatches: 0,
  }));

  const participantMap = new Map(leaderboard.map(p => [p.id, p]));

  for (const match of matches) {
    const actualHome = match.home_score!;
    const actualAway = match.away_score!;
    const actualDiff = actualHome - actualAway;
    const actualSign = actualDiff > 0 ? 1 : actualDiff < 0 ? -1 : 0;

    const matchPredictions = predictions.filter(p => p.match_id === match.id);

    for (const pred of matchPredictions) {
      const predHome = pred.home_score;
      const predAway = pred.away_score;
      const predDiff = predHome - predAway;
      const predSign = predDiff > 0 ? 1 : predDiff < 0 ? -1 : 0;

      const pEntry = participantMap.get(pred.participant_id);
      if (!pEntry) continue;

      if (predHome === actualHome && predAway === actualAway) {
        // Exact match -> 3 points
        pEntry.points += 3;
        pEntry.exactMatches += 1;
      } else if (predSign === actualSign) {
        // Correct winner/draw -> 1 point
        pEntry.points += 1;
        pEntry.winnerMatches += 1;
      }
    }
  }

  // Sort descending by points, then by exact matches
  return leaderboard.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.exactMatches - a.exactMatches;
  });
}
