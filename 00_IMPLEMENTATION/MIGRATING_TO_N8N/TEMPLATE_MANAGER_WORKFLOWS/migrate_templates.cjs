/**
 * Template Migration Script
 * Sprint: SP_028 - Template Management n8n Migration
 *
 * Purpose: Migrate existing templates from templates.json to n8n Data Tables
 *
 * Usage:
 *   node migrate_templates.js [mode]
 *
 * Arguments:
 *   mode - "testing" or "production" (default: testing)
 *
 * Prerequisites:
 *   1. n8n Data Tables created (clarioo_templates, clarioo_template_usage)
 *   2. n8n workflows imported and activated
 *   3. Node.js installed (v16+)
 *
 * Example:
 *   node migrate_templates.js testing
 *   node migrate_templates.js production
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MODE = process.argv[2] || 'testing';
const TEMPLATES_JSON_PATH = path.join(__dirname, '../../src/data/templates/templates.json');
const ADMIN_USER_ID = 'migration_admin';

// n8n webhook URLs
const WEBHOOK_URLS = {
  testing: 'http://localhost:8080/webhook/template-manager-testing',
  production: 'https://n8n.lakestrom.com/webhook/template-manager-production'
};

const WEBHOOK_URL = WEBHOOK_URLS[MODE];

if (!WEBHOOK_URL) {
  console.error(`❌ Invalid mode: ${MODE}. Use "testing" or "production"`);
  process.exit(1);
}

console.log(`\n🚀 Template Migration Script - ${MODE.toUpperCase()} Mode\n`);
console.log(`Webhook URL: ${WEBHOOK_URL}`);
console.log(`Templates file: ${TEMPLATES_JSON_PATH}\n`);

// Load templates from JSON
let templates;
try {
  const templatesRaw = fs.readFileSync(TEMPLATES_JSON_PATH, 'utf8');
  templates = JSON.parse(templatesRaw);
  console.log(`✅ Loaded ${templates.length} templates from JSON\n`);
} catch (error) {
  console.error(`❌ Failed to load templates.json:`, error.message);
  process.exit(1);
}

/**
 * Upload a single template to n8n Data Tables
 *
 * NOTE: This function uses a manual JSON insert approach since the upload
 * endpoint expects Excel files. For migration, we'll manually construct
 * INSERT requests to the n8n Data Table.
 *
 * The proper way to do this is via n8n workflow with a "migrate" action
 * that accepts JSON arrays. For now, we'll log the SQL INSERT statements
 * that can be run manually in n8n.
 */
async function uploadTemplate(template, index) {
  console.log(`\n[${index + 1}/${templates.length}] Migrating: ${template.lookingFor}`);
  console.log(`  Template ID: ${template.templateId}`);
  console.log(`  Category: ${template.templateCategory}`);
  console.log(`  Criteria: ${template.criteria.length}`);

  // Convert template to n8n Data Table format (new schema)
  const n8nTemplate = {
    template_id: template.templateId,
    template_category: template.templateCategory,
    searched_by: template.searchedBy,
    looking_for: template.lookingFor,
    key_features: template.keyFeatures,
    client_quote: template.clientQuote || null,
    current_tool: template.currentTool || null,
    criteria: template.criteria,
    vendors: [],
    comparison_matrix: {},
    battlecards: {},
    positioning_data: {},
    summary_data: {},
    uploaded_by: ADMIN_USER_ID,
    is_active: true
  };

  // For now, we'll output SQL INSERT statements that can be run manually
  // in the n8n Data Table interface or via a custom migration workflow

  console.log(`  ✅ Converted to n8n format`);

  return n8nTemplate;
}

/**
 * Generate SQL INSERT statements for manual migration
 */
function generateSQLInserts(templates) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`SQL INSERT STATEMENTS FOR MANUAL MIGRATION`);
  console.log(`${'='.repeat(80)}\n`);
  console.log(`Copy and paste these into n8n Data Table interface:\n`);

  templates.forEach((template, index) => {
    const n8nTemplate = {
      template_id: template.templateId,
      template_category: template.templateCategory,
      searched_by: template.searchedBy,
      looking_for: template.lookingFor,
      key_features: template.keyFeatures,
      client_quote: template.clientQuote || null,
      current_tool: template.currentTool || null,
      criteria: JSON.stringify(template.criteria),
      vendors: JSON.stringify([]),
      comparison_matrix: JSON.stringify({}),
      battlecards: JSON.stringify({}),
      positioning_data: JSON.stringify({}),
      summary_data: JSON.stringify({}),
      uploaded_by: ADMIN_USER_ID,
      is_active: true,
      created_at: new Date().toISOString()
    };

    console.log(`-- Template ${index + 1}: ${template.lookingFor}`);
    console.log(`INSERT INTO clarioo_templates (`);
    console.log(`  template_id, template_category, searched_by, looking_for,`);
    console.log(`  key_features, client_quote, current_tool, criteria,`);
    console.log(`  vendors, comparison_matrix, battlecards, positioning_data, summary_data,`);
    console.log(`  uploaded_by, is_active, created_at`);
    console.log(`) VALUES (`);
    console.log(`  '${n8nTemplate.template_id}',`);
    console.log(`  '${n8nTemplate.template_category}',`);
    console.log(`  '${n8nTemplate.searched_by}',`);
    console.log(`  '${n8nTemplate.looking_for.replace(/'/g, "''")}',`);
    console.log(`  '${n8nTemplate.key_features}',`);
    console.log(`  ${n8nTemplate.client_quote ? `'${n8nTemplate.client_quote.replace(/'/g, "''")}'` : 'NULL'},`);
    console.log(`  ${n8nTemplate.current_tool ? `'${n8nTemplate.current_tool}'` : 'NULL'},`);
    console.log(`  '${n8nTemplate.criteria}',`);
    console.log(`  '${n8nTemplate.vendors}',`);
    console.log(`  '${n8nTemplate.comparison_matrix}',`);
    console.log(`  '${n8nTemplate.battlecards}',`);
    console.log(`  '${n8nTemplate.positioning_data}',`);
    console.log(`  '${n8nTemplate.summary_data}',`);
    console.log(`  '${n8nTemplate.uploaded_by}',`);
    console.log(`  ${n8nTemplate.is_active},`);
    console.log(`  '${n8nTemplate.created_at}'`);
    console.log(`);\n`);
  });

  console.log(`${'='.repeat(80)}\n`);
}

/**
 * Generate JSON export for n8n import
 */
function generateJSONExport(templates) {
  const n8nTemplates = templates.map(template => ({
    template_id: template.templateId,
    template_category: template.templateCategory,
    searched_by: template.searchedBy,
    looking_for: template.lookingFor,
    key_features: template.keyFeatures,
    client_quote: template.clientQuote || null,
    current_tool: template.currentTool || null,
    criteria: template.criteria,
    vendors: [],
    comparison_matrix: {},
    battlecards: {},
    positioning_data: {},
    summary_data: {},
    uploaded_by: ADMIN_USER_ID,
    is_active: true,
    created_at: new Date().toISOString()
  }));

  const exportPath = path.join(__dirname, `templates_n8n_export_${MODE}.json`);
  fs.writeFileSync(exportPath, JSON.stringify(n8nTemplates, null, 2));

  console.log(`\n✅ JSON export saved to: ${exportPath}`);
  console.log(`   Import this file manually in n8n Data Table interface\n`);
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    console.log(`Starting migration of ${templates.length} templates...\n`);

    // Generate SQL INSERT statements
    generateSQLInserts(templates);

    // Generate JSON export
    generateJSONExport(templates);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`MIGRATION SUMMARY`);
    console.log(`${'='.repeat(80)}\n`);
    console.log(`✅ Total templates: ${templates.length}`);
    console.log(`✅ Mode: ${MODE}`);
    console.log(`✅ SQL statements generated above`);
    console.log(`✅ JSON export created: templates_n8n_export_${MODE}.json\n`);

    console.log(`NEXT STEPS:`);
    console.log(`1. Open n8n Data Tables interface`);
    console.log(`2. Navigate to clarioo_templates table`);
    console.log(`3. Use "Import" feature to upload templates_n8n_export_${MODE}.json`);
    console.log(`   OR copy/paste SQL INSERT statements above\n`);

    console.log(`VERIFICATION:`);
    console.log(`After migration, run this command to verify:`);
    console.log(`  curl "${WEBHOOK_URL}?action=list" | jq '.templates | length'\n`);
    console.log(`Expected result: 5\n`);

    console.log(`${'='.repeat(80)}\n`);
  } catch (error) {
    console.error(`\n❌ Migration failed:`, error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrate();
