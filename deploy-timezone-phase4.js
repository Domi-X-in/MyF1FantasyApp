#!/usr/bin/env node

/**
 * Phase 4 Deployment Script: Timezone-Aware Race Editing
 * Ensures database is ready and system is validated for Phase 4 functionality
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

class Phase4Deployer {
  constructor() {
    this.deploymentSteps = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m', // Yellow
      reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async addDeploymentStep(stepName, success, message) {
    this.deploymentSteps.push({ stepName, success, message });
    this.log(`${success ? '✅' : '❌'} ${stepName}: ${message}`, success ? 'success' : 'error');
  }

  // Step 1: Check database connection
  async checkDatabaseConnection() {
    this.log('🔍 Checking database connection...', 'info');
    
    try {
      const { data, error } = await supabase
        .from('races')
        .select('count(*)')
        .limit(1);

      if (error) throw error;

      await this.addDeploymentStep('Database Connection', true, 'Successfully connected to database');
      return true;

    } catch (error) {
      await this.addDeploymentStep('Database Connection', false, `Failed: ${error.message}`);
      return false;
    }
  }

  // Step 2: Verify timezone migration status
  async verifyTimezoneSchema() {
    this.log('🔍 Verifying timezone schema...', 'info');
    
    try {
      // Check if timezone columns exist
      const { data: races, error } = await supabase
        .from('races')
        .select('race_time, timezone, race_datetime_utc, country, circuit_name')
        .limit(1);

      if (error) throw error;

      const hasTimezoneColumns = races.length === 0 || 
        (races[0].hasOwnProperty('race_time') && 
         races[0].hasOwnProperty('timezone') &&
         races[0].hasOwnProperty('race_datetime_utc'));

      if (hasTimezoneColumns) {
        await this.addDeploymentStep('Timezone Schema', true, 'All timezone columns are present');
        return true;
      } else {
        await this.addDeploymentStep('Timezone Schema', false, 'Missing timezone columns - migration needed');
        return false;
      }

    } catch (error) {
      await this.addDeploymentStep('Timezone Schema', false, `Failed: ${error.message}`);
      return false;
    }
  }

  // Step 3: Run migration if needed
  async runMigrationIfNeeded() {
    this.log('🔧 Checking if migration is needed...', 'info');
    
    try {
      const schemaReady = await this.verifyTimezoneSchema();
      
      if (schemaReady) {
        await this.addDeploymentStep('Migration Check', true, 'Schema already up to date');
        return true;
      }

      // Try to run migration
      this.log('📁 Reading migration file...', 'info');
      
      const migrationPath = path.join(__dirname, 'timezone-migration.sql');
      if (!fs.existsSync(migrationPath)) {
        await this.addDeploymentStep('Migration File', false, 'timezone-migration.sql not found');
        return false;
      }

      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      this.log('⚠️ Migration file found but cannot execute SQL directly through Supabase client', 'warning');
      this.log('Please run the migration manually using your database admin tools:', 'warning');
      this.log(`1. Connect to your database`, 'warning');
      this.log(`2. Execute the contents of: ${migrationPath}`, 'warning');
      this.log(`3. Re-run this deployment script`, 'warning');

      await this.addDeploymentStep('Migration Execution', false, 'Manual migration required');
      return false;

    } catch (error) {
      await this.addDeploymentStep('Migration Check', false, `Failed: ${error.message}`);
      return false;
    }
  }

  // Step 4: Verify timezone functions
  async verifyTimezoneFunctions() {
    this.log('🔍 Verifying timezone functions...', 'info');
    
    try {
      // Test timezone calculation with a known case
      const testDate = '2025-05-25';
      const testTime = '15:00:00';
      const testTimezone = 'Europe/Monaco';

      // We can't directly call SQL functions, so we'll check if the system
      // can handle timezone data properly through the application layer
      
      // Create a test race to verify the system
      const { data: testRace, error: createError } = await supabase
        .from('races')
        .insert({
          name: 'Phase 4 Deployment Test',
          city: 'Monaco',
          date: testDate,
          race_time: testTime,
          timezone: testTimezone,
          country: 'Monaco',
          circuit_name: 'Circuit de Monaco'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Check if race_datetime_utc was calculated
      const hasUTCCalculation = testRace.race_datetime_utc !== null;

      // Clean up test race
      await supabase
        .from('races')
        .delete()
        .eq('id', testRace.id);

      if (hasUTCCalculation) {
        await this.addDeploymentStep('Timezone Functions', true, 'UTC calculation working correctly');
        return true;
      } else {
        await this.addDeploymentStep('Timezone Functions', false, 'UTC calculation not working');
        return false;
      }

    } catch (error) {
      await this.addDeploymentStep('Timezone Functions', false, `Failed: ${error.message}`);
      return false;
    }
  }

  // Step 5: Verify existing races have timezone data
  async verifyExistingRacesData() {
    this.log('🔍 Verifying existing races have timezone data...', 'info');
    
    try {
      const { data: races, error } = await supabase
        .from('races')
        .select('id, name, timezone, race_time, race_datetime_utc');

      if (error) throw error;

      if (races.length === 0) {
        await this.addDeploymentStep('Existing Races Data', true, 'No existing races to check');
        return true;
      }

      const racesWithTimezone = races.filter(race => 
        race.timezone && race.race_time && race.race_datetime_utc
      );

      const percentageWithTimezone = Math.round((racesWithTimezone.length / races.length) * 100);

      if (percentageWithTimezone >= 80) {
        await this.addDeploymentStep('Existing Races Data', true, 
          `${racesWithTimezone.length}/${races.length} races have timezone data (${percentageWithTimezone}%)`);
        return true;
      } else {
        await this.addDeploymentStep('Existing Races Data', false, 
          `Only ${racesWithTimezone.length}/${races.length} races have timezone data (${percentageWithTimezone}%)`);
        return false;
      }

    } catch (error) {
      await this.addDeploymentStep('Existing Races Data', false, `Failed: ${error.message}`);
      return false;
    }
  }

  // Step 6: Test Phase 4 functionality
  async testPhase4Functionality() {
    this.log('🧪 Testing Phase 4 functionality...', 'info');
    
    try {
      // Test race creation with timezone data
      const testRaceData = {
        name: 'Phase 4 Function Test',
        city: 'Singapore',
        date: '2025-09-21',
        race_time: '20:00:00',
        timezone: 'Asia/Singapore',
        country: 'Singapore',
        circuit_name: 'Marina Bay Street Circuit'
      };

      const { data: createdRace, error: createError } = await supabase
        .from('races')
        .insert(testRaceData)
        .select()
        .single();

      if (createError) throw createError;

      // Test race update (edit functionality)
      const updates = {
        race_time: '21:00:00',
        timezone: 'Asia/Singapore'
      };

      const { error: updateError } = await supabase
        .from('races')
        .update(updates)
        .eq('id', createdRace.id);

      if (updateError) throw updateError;

      // Verify update
      const { data: updatedRace, error: fetchError } = await supabase
        .from('races')
        .select('*')
        .eq('id', createdRace.id)
        .single();

      if (fetchError) throw fetchError;

      // Clean up test race
      await supabase
        .from('races')
        .delete()
        .eq('id', createdRace.id);

      const functionalityWorking = 
        updatedRace.race_time === updates.race_time && 
        updatedRace.timezone === updates.timezone &&
        updatedRace.race_datetime_utc !== null;

      if (functionalityWorking) {
        await this.addDeploymentStep('Phase 4 Functionality', true, 'Race creation and editing working correctly');
        return true;
      } else {
        await this.addDeploymentStep('Phase 4 Functionality', false, 'Race editing not working correctly');
        return false;
      }

    } catch (error) {
      await this.addDeploymentStep('Phase 4 Functionality', false, `Failed: ${error.message}`);
      return false;
    }
  }

  // Step 7: Generate deployment report
  async generateDeploymentReport() {
    this.log('📋 Generating deployment report...', 'info');
    
    const passed = this.deploymentSteps.filter(step => step.success).length;
    const total = this.deploymentSteps.length;
    const percentage = Math.round((passed / total) * 100);

    const report = {
      timestamp: new Date().toISOString(),
      phase: 'Phase 4: Race Editing Interface',
      environment: supabaseUrl.includes('localhost') ? 'Development' : 'Production',
      overall_status: percentage >= 80 ? 'READY' : 'NEEDS_ATTENTION',
      steps: this.deploymentSteps,
      summary: {
        total_steps: total,
        passed_steps: passed,
        success_rate: `${percentage}%`
      },
      next_actions: []
    };

    // Add specific recommendations based on failures
    if (percentage < 80) {
      report.next_actions.push('Review failed deployment steps above');
      
      const failedSteps = this.deploymentSteps.filter(step => !step.success);
      failedSteps.forEach(step => {
        if (step.stepName === 'Timezone Schema') {
          report.next_actions.push('Run timezone-migration.sql using database admin tools');
        }
        if (step.stepName === 'Existing Races Data') {
          report.next_actions.push('Populate existing races with timezone data');
        }
        if (step.stepName === 'Phase 4 Functionality') {
          report.next_actions.push('Debug race editing functionality');
        }
      });
    } else {
      report.next_actions.push('System ready for Phase 4 deployment');
      report.next_actions.push('Consider running test-timezone-phase4.js for comprehensive testing');
      report.next_actions.push('Deploy to production environment');
    }

    // Save report to file
    const reportPath = path.join(__dirname, `phase4-deployment-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log(`📄 Deployment report saved to: ${reportPath}`, 'success');
    return report;
  }

  // Main deployment function
  async deploy() {
    this.log('🚀 Starting Phase 4 Deployment Verification...', 'info');
    this.log('==================================================', 'info');
    
    try {
      // Run all deployment steps
      await this.checkDatabaseConnection();
      await this.verifyTimezoneSchema();
      await this.runMigrationIfNeeded();
      await this.verifyTimezoneFunctions();
      await this.verifyExistingRacesData();
      await this.testPhase4Functionality();
      
      // Generate final report
      const report = await this.generateDeploymentReport();
      
      this.log('\n📊 Phase 4 Deployment Summary', 'info');
      this.log('============================', 'info');
      
      this.deploymentSteps.forEach(step => {
        const status = step.success ? '✅' : '❌';
        this.log(`${status} ${step.stepName}: ${step.message}`, step.success ? 'success' : 'error');
      });
      
      this.log(`\n📈 Overall Status: ${report.summary.passed_steps}/${report.summary.total_steps} steps passed (${report.summary.success_rate})`, 
               report.overall_status === 'READY' ? 'success' : 'warning');
      
      if (report.overall_status === 'READY') {
        this.log('🎉 Phase 4 Race Editing Interface is ready for deployment!', 'success');
        this.log('\n📋 Next Steps:', 'info');
        this.log('1. Deploy the updated frontend components', 'info');
        this.log('2. Run comprehensive testing in staging', 'info');
        this.log('3. Train admin users on new edit functionality', 'info');
        this.log('4. Monitor system performance after deployment', 'info');
      } else {
        this.log('⚠️  Deployment verification failed. Please address the issues above.', 'warning');
        this.log('\n📋 Required Actions:', 'warning');
        report.next_actions.forEach(action => {
          this.log(`- ${action}`, 'warning');
        });
      }
      
      this.log('\n✨ Phase 4 Deployment Verification Complete!', 'info');
      return report;

    } catch (error) {
      this.log(`Deployment verification error: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Run deployment verification
if (require.main === module) {
  const deployer = new Phase4Deployer();
  deployer.deploy().catch(console.error);
}

module.exports = Phase4Deployer;