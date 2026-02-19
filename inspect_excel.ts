import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const filePath = path.join(__dirname, 'setup_files/מערכות מורים תשפו.xlsx');

if (!fs.existsSync(filePath)) {
    console.error(`File not found at ${filePath}`);
    process.exit(1);
}

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0]; // Just check the first sheet (first teacher)
const sheet = workbook.Sheets[sheetName];
const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');

console.log(`Inspecting sheet: ${sheetName}`);
console.log("Looking for non-empty cells in the first few rows...");

for (let R = 1; R <= Math.min(range.e.r, 10); ++R) {
    for (let C = 1; C <= 6; ++C) {
        const cell = sheet[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell && cell.v) {
            const val = cell.v.toString();
            console.log(`\nCell [${R},${C}]:`);
            console.log(`Resource string: ${JSON.stringify(val)}`);
            console.log("Split by \\n:", val.split('\n'));
            console.log("Split by \\r:", val.split('\r'));
            console.log("Split by \\r\\n:", val.split('\r\n'));
        }
    }
}
