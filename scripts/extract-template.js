import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Excel file
const workbook = XLSX.readFile(path.join(__dirname, '../00_IMPLEMENTATION/WIP/Templates.xlsx'));

// Get the first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Print the data for inspection
console.log('Excel Data:');
console.log(JSON.stringify(data, null, 2));

// Print sheet names
console.log('\nSheet names:', workbook.SheetNames);
