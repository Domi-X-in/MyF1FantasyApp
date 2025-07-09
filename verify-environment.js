#!/usr/bin/env node

// Environment verification script
// This script helps verify that environment variables are set correctly

const { getEnvironmentConfig, getCurrentEnvironment, logEnvironmentInfo } = require('./lib/environment')

console.log('🔍 Environment Verification Script')
console.log('=====================================\n')

// Check current environment
const currentEnv = getCurrentEnvironment()
console.log(`Current Environment: ${currentEnv.toUpperCase()}`)

// Get environment configuration
const config = getEnvironmentConfig()
console.log(`Environment Name: ${config.name}`)
console.log(`Supabase URL: ${config.supabaseUrl}`)
console.log(`Is Production: ${config.isProduction}`)

// Check if Supabase client can be created
if (config.supabaseUrl && config.supabaseKey) {
  console.log('✅ Supabase configuration is complete')
  
  // Test Supabase connection
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(config.supabaseUrl, config.supabaseKey)
  
  console.log('🔗 Testing Supabase connection...')
  
  // Try a simple query to test connection
  supabase.from('users').select('count').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('⚠️  Supabase connection test:', error.message)
        console.log('   This might be expected if the table doesn\'t exist yet')
      } else {
        console.log('✅ Supabase connection successful')
      }
    })
    .catch(err => {
      console.log('❌ Supabase connection failed:', err.message)
    })
} else {
  console.log('❌ Supabase configuration is incomplete')
  console.log('   Missing URL or Key')
}

// Check environment variables
console.log('\n📋 Environment Variables Check:')
console.log('================================')

const requiredVars = {
  'NEXT_PUBLIC_ENVIRONMENT': process.env.NEXT_PUBLIC_ENVIRONMENT,
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'NEXT_PUBLIC_SUPABASE_URL_QA': process.env.NEXT_PUBLIC_SUPABASE_URL_QA,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY_QA': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_QA,
  'NEXT_PUBLIC_SUPABASE_URL_DEV': process.env.NEXT_PUBLIC_SUPABASE_URL_DEV,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV,
}

Object.entries(requiredVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌'
  const displayValue = value ? `${value.substring(0, 20)}...` : 'Not set'
  console.log(`${status} ${key}: ${displayValue}`)
})

// Environment-specific recommendations
console.log('\n💡 Recommendations:')
console.log('==================')

if (currentEnv === 'qa') {
  console.log('• For QA environment, ensure NEXT_PUBLIC_SUPABASE_URL_QA is set')
  console.log('• Verify QA database schema is deployed')
  console.log('• Check that QA Supabase project is active')
} else if (currentEnv === 'prod') {
  console.log('• For Production environment, ensure NEXT_PUBLIC_SUPABASE_URL is set')
  console.log('• Verify production database is accessible')
  console.log('• Check that production Supabase project is active')
} else {
  console.log('• For Development environment, check your .env.local file')
  console.log('• Ensure development database is set up')
}

console.log('\n🎨 Visual Indicators:')
console.log('====================')
console.log(`• Header Color: ${config.name === 'QA' ? 'Orange' : config.name === 'Production' ? 'Red' : 'Blue'}`)
console.log(`• Environment Name: ${config.name}`)

console.log('\n✨ Verification complete!') 