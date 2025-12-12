import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Excel file
const workbook = XLSX.readFile(path.join(__dirname, '../00_IMPLEMENTATION/WIP/Templates.xlsx'));
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON with headers
const rows = XLSX.utils.sheet_to_json(worksheet);

console.log('Total rows:', rows.length);
console.log('\nFirst row sample:');
console.log(JSON.stringify(rows[0], null, 2));

// Group rows by template_id
const templates = [];
let currentTemplate = null;
let criteriaIdCounter = 1;

rows.forEach((row, index) => {
  // If template_id exists, start a new template
  if (row.template_id) {
    if (currentTemplate) {
      templates.push(currentTemplate);
    }

    currentTemplate = {
      id: row.template_id,
      category: row.category?.trim() || '',
      name: row.company_type || '',
      metadata: row.company_details || '',
      currentSolution: row.current_tool ? `Currently: ${row.current_tool}` : null,
      painPoints: row.pain_quote || null,
      lookingFor: row.looking_for || '',
      criteria: []
    };
  }

  // Add criterion to current template
  if (currentTemplate && row.criteria && row.description) {
    const importance = row.criteria_priority_level?.toLowerCase().trim() || 'medium';
    const type = row.criteria_category?.toLowerCase().trim() || 'feature';

    currentTemplate.criteria.push({
      id: `crit_${String(criteriaIdCounter++).padStart(3, '0')}`,
      name: row.criteria.trim(),
      explanation: row.description.trim(),
      importance: importance === 'high ' ? 'high' : importance,
      type: type,
      isArchived: false
    });
  }
});

// Add the last template
if (currentTemplate) {
  templates.push(currentTemplate);
}

console.log(`\n\nProcessed ${templates.length} template(s)`);
templates.forEach((t, i) => {
  console.log(`\nTemplate ${i + 1}:`);
  console.log(`  ID: ${t.id}`);
  console.log(`  Category: ${t.category}`);
  console.log(`  Name: ${t.name}`);
  console.log(`  Criteria count: ${t.criteria.length}`);
});

// Write to JSON file
const outputPath = path.join(__dirname, '../src/data/templates/templates.json');
const outputDir = path.dirname(outputPath);

// Create directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(templates, null, 2));
console.log(`\n✅ Template data written to: ${outputPath}`);
