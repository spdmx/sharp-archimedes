const Database = require('better-sqlite3');
const xlsx = require('xlsx');

const db = new Database('quiniela.db');

db.exec(`
  DROP TABLE IF EXISTS predictions;
  DROP TABLE IF EXISTS matches;
  DROP TABLE IF EXISTS participants;

  CREATE TABLE participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE matches (
    id INTEGER PRIMARY KEY,
    home_team TEXT NOT NULL,
    home_flag TEXT,
    away_team TEXT NOT NULL,
    away_flag TEXT,
    status TEXT DEFAULT 'PENDING',
    home_score INTEGER,
    away_score INTEGER
  );

  CREATE TABLE predictions (
    participant_id INTEGER,
    match_id INTEGER,
    home_score INTEGER,
    away_score INTEGER,
    PRIMARY KEY(participant_id, match_id)
  );
`);

const workbook = xlsx.readFile('Quiniela Mundial 2026 Sociedad.xlsx');
const worksheet = workbook.Sheets['Resultados'];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

const insertParticipant = db.prepare('INSERT INTO participants (id, name) VALUES (?, ?)');
const insertMatch = db.prepare('INSERT INTO matches (id, home_team, home_flag, away_team, away_flag, home_score, away_score) VALUES (?, ?, ?, ?, ?, ?, ?)');
const insertPrediction = db.prepare('INSERT INTO predictions (participant_id, match_id, home_score, away_score) VALUES (?, ?, ?, ?)');

// Parse Participants (Row 0, starting index 9, every 3 columns)
const row0 = data[0];
const participants = [];
for (let i = 9; i < row0.length; i += 3) {
  if (row0[i] && typeof row0[i] === 'string' && row0[i].trim() !== '') {
    const id = participants.length + 1;
    participants.push({ id, name: row0[i].trim(), colIndex: i });
    insertParticipant.run(id, row0[i].trim());
  }
}

console.log(`Found ${participants.length} participants.`);

// Parse Matches and Predictions
let matchCount = 0;
for (let r = 3; r < data.length; r++) {
  const row = data[r];
  if (!row || row.length < 6) continue;
  
  const homeTeam = row[0];
  const matchNum = row[5];
  
  if (!homeTeam || typeof matchNum !== 'number') continue;
  
  const homeFlag = row[1] || '';
  const awayFlag = row[3] || '';
  const awayTeam = row[4] || '';
  
  // Real match results if available
  let realHomeScore = row[6];
  let realAwayScore = row[8];
  
  // Clean up real scores (they might be strings or empty)
  if (typeof realHomeScore !== 'number') realHomeScore = null;
  if (typeof realAwayScore !== 'number') realAwayScore = null;
  
  insertMatch.run(matchNum, homeTeam, homeFlag, awayTeam, awayFlag, realHomeScore, realAwayScore);
  matchCount++;
  
  // Predictions
  for (const p of participants) {
    let pHome = row[p.colIndex];
    let pAway = row[p.colIndex + 2];
    
    if (typeof pHome === 'number' && typeof pAway === 'number') {
      insertPrediction.run(p.id, matchNum, pHome, pAway);
    }
  }
}

console.log(`Imported ${matchCount} matches and their predictions.`);
db.close();
