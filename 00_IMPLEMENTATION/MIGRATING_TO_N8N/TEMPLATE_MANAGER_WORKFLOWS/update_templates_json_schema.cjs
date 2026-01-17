/**
 * Schema Update Script for templates.json
 * Updates static templates.json to match new n8n schema
 *
 * OLD SCHEMA:
 * - category, companyType, companyDetails, painQuote
 *
 * NEW SCHEMA:
 * - templateCategory, searchedBy, keyFeatures, clientQuote
 *
 * Usage: node update_templates_json_schema.js
 */

const fs = require('fs');
const path = require('path');

const TEMPLATES_PATH = path.join(__dirname, '../../src/data/templates/templates.json');
const BACKUP_PATH = path.join(__dirname, '../../src/data/templates/templates.json.backup');

console.log('🔄 Updating templates.json schema...\n');

// Read existing templates
const templatesRaw = fs.readFileSync(TEMPLATES_PATH, 'utf8');
const templates = JSON.parse(templatesRaw);

console.log(`✅ Loaded ${templates.length} templates\n`);

// Create backup
fs.writeFileSync(BACKUP_PATH, templatesRaw);
console.log(`💾 Backup created: ${BACKUP_PATH}\n`);

// Transform each template
const updatedTemplates = templates.map((template, idx) => {
  console.log(`[${idx + 1}/${templates.length}] Transforming: ${template.lookingFor.substring(0, 50)}...`);

  // Extract first 4 criteria names as key features
  const keyFeatures = template.criteria
    .slice(0, 4)
    .map(c => c.name)
    .join(', ');

  // Combine companyType and companyDetails into searchedBy
  const searchedBy = template.companyDetails
    ? `${template.companyType} – ${template.companyDetails.split('•')[0].trim()}`
    : template.companyType;

  // Convert painQuote to positive clientQuote (optional - keep as is for now)
  // In production, these should be rewritten as positive testimonials
  const clientQuote = template.painQuote;

  // Convert category to uppercase template_category
  const templateCategory = template.category.toUpperCase();

  return {
    templateId: template.templateId,
    templateCategory,
    searchedBy,
    lookingFor: template.lookingFor,
    keyFeatures,
    clientQuote,
    currentTool: template.currentTool,
    criteria: template.criteria
  };
});

// Write updated templates
fs.writeFileSync(TEMPLATES_PATH, JSON.stringify(updatedTemplates, null, 2));

console.log(`\n✅ Updated templates.json with new schema`);
console.log(`📊 Changes:`);
console.log(`   - Renamed: category → templateCategory (uppercase)`);
console.log(`   - Merged: companyType + companyDetails → searchedBy`);
console.log(`   - Added: keyFeatures (first 4 criteria names)`);
console.log(`   - Renamed: painQuote → clientQuote`);
console.log(`   - Removed: companyType, companyDetails`);
console.log(`\n✅ Backup saved to: ${BACKUP_PATH}`);
console.log(`\n⚠️  NEXT STEP: Review templates.json and update clientQuote fields`);
console.log(`   to be positive testimonials instead of pain quotes\n`);
