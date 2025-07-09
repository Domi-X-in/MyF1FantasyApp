#!/usr/bin/env node

/**
 * Timezone Migration Runner for F1 Fantasy App
 * 
 * This script runs the timezone migration to add timezone support to the races table.
 * It should be run in your Supabase SQL editor or using the Supabase CLI.
 */

const fs = require('fs');
const path = require('path');

console.log('🏁 F1 Fantasy App - Timezone Migration Runner');
console.log('============================================');
console.log('');

// Read the migration file
const migrationPath = path.join(__dirname, 'timezone-migration.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 Migration Overview:');
console.log('  • Add timezone support columns to races table');
console.log('  • Create timezone utility functions');
console.log('  • Populate existing races with timezone data');
console.log('  • Add triggers for automatic UTC calculation');
console.log('');

console.log('📄 Migration file ready:', migrationPath);
console.log('');

console.log('🔧 How to run this migration:');
console.log('');
console.log('Option 1 - Supabase Dashboard:');
console.log('  1. Go to your Supabase dashboard');
console.log('  2. Navigate to SQL Editor');
console.log('  3. Copy and paste the content from timezone-migration.sql');
console.log('  4. Click "Run"');
console.log('');

console.log('Option 2 - Supabase CLI:');
console.log('  1. Make sure you have supabase CLI installed');
console.log('  2. Run: supabase db reset');
console.log('  3. Then run: cat timezone-migration.sql | supabase db apply');
console.log('');

console.log('Option 3 - Node.js with Supabase client:');
console.log('  1. Uncomment the code below and add your Supabase credentials');
console.log('  2. Run: node run-timezone-migration.js');
console.log('');

console.log('⚠️  IMPORTANT NOTES:');
console.log('  • This migration is backward compatible');
console.log('  • Existing functionality will continue to work');
console.log('  • New timezone features will be enabled for future races');
console.log('  • No data will be lost');
console.log('');

console.log('✨ After migration, your app will support:');
console.log('  • Timezone-aware race scheduling');
console.log('  • Prediction cutoffs based on actual race start time');
console.log('  • Multi-timezone race time display');
console.log('  • Enhanced admin race management');
console.log('');

// Uncomment and configure this section to run the migration programmatically
/*
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY';

async function runMigration() {
  console.log('🚀 Running migration...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data, error } = await supabase.rpc('exec', { 
      sql: migrationSQL 
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('🎉 Your F1 Fantasy app now supports timezone-aware race scheduling!');
    
  } catch (err) {
    console.error('❌ Migration error:', err);
  }
}

// Uncomment this line to run the migration
// runMigration();
*/

console.log('📝 Migration content preview:');
console.log('─'.repeat(50));
console.log(migrationSQL.split('\n').slice(0, 20).join('\n'));
console.log('... (truncated)');
console.log('─'.repeat(50));
console.log('');
console.log('Full migration file:', migrationPath);