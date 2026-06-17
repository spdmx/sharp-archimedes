async function testApi() {
  const token = '8107b8d1a22349c9b5d6521c9ba1946d';
  const res = await fetch('https://api.football-data.org/v4/competitions/WC/teams', {
    headers: { 'X-Auth-Token': token }
  });
  const data = await res.json();
  if (data.teams) {
    data.teams.forEach(t => console.log(`${t.name} (${t.tla})`));
  } else {
    console.log(data);
  }
}
testApi();
