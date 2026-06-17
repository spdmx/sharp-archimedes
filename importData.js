const { createClient } = require('@libsql/client');
const xlsx = require('xlsx');

async function run() {
  // Clean up potential quotes from Windows CMD
  const rawUrl = process.env.TURSO_DATABASE_URL || 'file:quiniela.db';
  const url = rawUrl.replace(/^["']|["']$/g, '');
  const rawToken = process.env.TURSO_AUTH_TOKEN;
  const authToken = rawToken ? rawToken.replace(/^["']|["']$/g, '') : undefined;
  
  const db = createClient({ url, authToken });

  console.log(`Connecting to database at ${url}`);

  await db.execute(`DROP TABLE IF EXISTS predictions`);
  await db.execute(`DROP TABLE IF EXISTS matches`);
  await db.execute(`DROP TABLE IF EXISTS participants`);

  await db.execute(`
    CREATE TABLE participants (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE matches (
      id INTEGER PRIMARY KEY,
      home_team TEXT NOT NULL,
      home_flag TEXT,
      away_team TEXT NOT NULL,
      away_flag TEXT,
      status TEXT DEFAULT 'PENDING',
      home_score INTEGER,
      away_score INTEGER
    )
  `);

  await db.execute(`
    CREATE TABLE predictions (
      participant_id INTEGER,
      match_id INTEGER,
      home_score INTEGER,
      away_score INTEGER,
      PRIMARY KEY(participant_id, match_id)
    )
  `);

  const workbook = xlsx.readFile('Quiniela Mundial 2026 Sociedad.xlsx');
  const worksheet = workbook.Sheets['Resultados'];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  // Parse Participants
  const row0 = data[0];
  const participants = [];
  const participantStatements = [];
  for (let i = 9; i < row0.length; i += 3) {
    if (row0[i] && typeof row0[i] === 'string' && row0[i].trim() !== '') {
      const id = participants.length + 1;
      participants.push({ id, name: row0[i].trim(), colIndex: i });
      participantStatements.push({
        sql: 'INSERT INTO participants (id, name) VALUES (?, ?)',
        args: [id, row0[i].trim()]
      });
    }
  }

  if (participantStatements.length > 0) {
    await db.batch(participantStatements);
  }
  console.log(`Found and imported ${participants.length} participants.`);

  // Parse Matches and Predictions
  let matchCount = 0;
  let predictionCount = 0;
  const matchStatements = [];
  let predictionStatements = [];

  for (let r = 3; r < data.length; r++) {
    const row = data[r];
    if (!row || row.length < 6) continue;
    
    const homeTeam = row[0];
    const matchNum = row[5];
    
    if (!homeTeam || typeof matchNum !== 'number') continue;
    
    const homeFlag = row[1] || '';
    const awayFlag = row[3] || '';
    const awayTeam = row[4] || '';
    
    let realHomeScore = row[6];
    let realAwayScore = row[8];
    if (typeof realHomeScore !== 'number') realHomeScore = null;
    if (typeof realAwayScore !== 'number') realAwayScore = null;
    
    matchStatements.push({
      sql: 'INSERT INTO matches (id, home_team, home_flag, away_team, away_flag, home_score, away_score) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [matchNum, homeTeam, homeFlag, awayTeam, awayFlag, realHomeScore, realAwayScore]
    });
    matchCount++;
    
    // Predictions
    for (const p of participants) {
      let pHome = row[p.colIndex];
      let pAway = row[p.colIndex + 2];
      
      if (typeof pHome === 'number' && typeof pAway === 'number') {
        predictionStatements.push({
          sql: 'INSERT INTO predictions (participant_id, match_id, home_score, away_score) VALUES (?, ?, ?, ?)',
          args: [p.id, matchNum, pHome, pAway]
        });
        predictionCount++;
      }
    }
  }

  // Insert matches in batch
  if (matchStatements.length > 0) {
    await db.batch(matchStatements);
  }

  // Insert predictions in batches of 100 to avoid limits
  const BATCH_SIZE = 100;
  for (let i = 0; i < predictionStatements.length; i += BATCH_SIZE) {
    const chunk = predictionStatements.slice(i, i + BATCH_SIZE);
    await db.batch(chunk);
  }

  console.log(`Imported ${matchCount} matches and ${predictionCount} predictions.`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
