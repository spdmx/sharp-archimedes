const xlsx = require('xlsx');
const workbook = xlsx.readFile('Quiniela Mundial 2026 Sociedad.xlsx');

['Grupos', 'Participantes', 'Resultados'].forEach(sheetName => {
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    console.log(`\n--- ${sheetName} ---`);
    for (let i = 0; i < Math.min(5, data.length); i++) {
        console.log(`Row ${i}:`, JSON.stringify(data[i]));
    }
});
