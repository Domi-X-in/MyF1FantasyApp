const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

async function copyProdToQA() {
  console.log('🚀 Copying Production Data to QA Environment...')
  console.log('')
  
  // Check if environment variables are set
  const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const prodKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const qaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_QA
  const qaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_QA
  
  if (!prodUrl || !prodKey || !qaUrl || !qaKey) {
    console.error('❌ Environment variables not found!')
    console.error('')
    console.error('Please ensure these variables are set in your .env.local file:')
    console.error('NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key')
    console.error('NEXT_PUBLIC_SUPABASE_URL_QA=https://your-qa-project.supabase.co')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY_QA=your_qa_anon_key')
    console.error('')
    console.error('Current values:')
    console.error(`NEXT_PUBLIC_SUPABASE_URL: ${prodUrl ? 'SET' : 'NOT SET'}`)
    console.error(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${prodKey ? 'SET' : 'NOT SET'}`)
    console.error(`NEXT_PUBLIC_SUPABASE_URL_QA: ${qaUrl ? 'SET' : 'NOT SET'}`)
    console.error(`NEXT_PUBLIC_SUPABASE_ANON_KEY_QA: ${qaKey ? 'SET' : 'NOT SET'}`)
    console.error('')
    process.exit(1)
  }
  
  // Create Supabase clients
  const prodClient = createClient(prodUrl, prodKey)
  const qaClient = createClient(qaUrl, qaKey)
  
  try {
    console.log('📊 Step 1: Fetching production data...')
    
    // Fetch all data from production
    const [usersResult, racesResult, predictionsResult, passwordResetsResult] = await Promise.all([
      prodClient.from('users').select('*'),
      prodClient.from('races').select('*'),
      prodClient.from('predictions').select('*'),
      prodClient.from('password_reset_requests').select('*')
    ])
    
    if (usersResult.error) {
      console.error('❌ Error fetching users:', usersResult.error)
      process.exit(1)
    }
    if (racesResult.error) {
      console.error('❌ Error fetching races:', racesResult.error)
      process.exit(1)
    }
    if (predictionsResult.error) {
      console.error('❌ Error fetching predictions:', predictionsResult.error)
      process.exit(1)
    }
    if (passwordResetsResult.error) {
      console.error('❌ Error fetching password resets:', passwordResetsResult.error)
      process.exit(1)
    }
    
    const users = usersResult.data || []
    const races = racesResult.data || []
    const predictions = predictionsResult.data || []
    const passwordResets = passwordResetsResult.data || []
    
    console.log(`✅ Fetched ${users.length} users`)
    console.log(`✅ Fetched ${races.length} races`)
    console.log(`✅ Fetched ${predictions.length} predictions`)
    console.log(`✅ Fetched ${passwordResets.length} password reset requests`)
    console.log('')
    
    console.log('🗑️  Step 2: Clearing QA database...')
    
    // Clear QA database (in reverse order due to foreign key constraints)
    const clearResults = await Promise.all([
      qaClient.from('password_reset_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      qaClient.from('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      qaClient.from('races').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      qaClient.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    ])
    
    console.log('✅ QA database cleared')
    console.log('')
    
    console.log('📝 Step 3: Copying data to QA...')
    
    // Copy users first (no dependencies)
    if (users.length > 0) {
      console.log(`📋 Copying ${users.length} users...`)
      const usersResult = await qaClient.from('users').insert(users)
      if (usersResult.error) {
        console.error('❌ Error copying users:', usersResult.error)
        process.exit(1)
      }
      console.log('✅ Users copied successfully')
    }
    
    // Copy races (no dependencies)
    if (races.length > 0) {
      console.log(`📋 Copying ${races.length} races...`)
      const racesResult = await qaClient.from('races').insert(races)
      if (racesResult.error) {
        console.error('❌ Error copying races:', racesResult.error)
        process.exit(1)
      }
      console.log('✅ Races copied successfully')
    }
    
    // Copy predictions (depends on users and races)
    if (predictions.length > 0) {
      console.log(`📋 Copying ${predictions.length} predictions...`)
      const predictionsResult = await qaClient.from('predictions').insert(predictions)
      if (predictionsResult.error) {
        console.error('❌ Error copying predictions:', predictionsResult.error)
        process.exit(1)
      }
      console.log('✅ Predictions copied successfully')
    }
    
    // Copy password reset requests (depends on users)
    if (passwordResets.length > 0) {
      console.log(`📋 Copying ${passwordResets.length} password reset requests...`)
      const passwordResetsResult = await qaClient.from('password_reset_requests').insert(passwordResets)
      if (passwordResetsResult.error) {
        console.error('❌ Error copying password reset requests:', passwordResetsResult.error)
        process.exit(1)
      }
      console.log('✅ Password reset requests copied successfully')
    }
    
    console.log('')
    console.log('🎉 Data copy completed successfully!')
    console.log('')
    console.log('📊 Summary:')
    console.log(`   Users: ${users.length}`)
    console.log(`   Races: ${races.length}`)
    console.log(`   Predictions: ${predictions.length}`)
    console.log(`   Password Reset Requests: ${passwordResets.length}`)
    console.log('')
    console.log('🔗 QA Dashboard:')
    const qaProjectRef = qaUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
    if (qaProjectRef) {
      console.log(`   https://supabase.com/dashboard/project/${qaProjectRef}`)
    }
    console.log('')
    console.log('💡 Your QA environment now has a complete copy of production data!')
    console.log('   You can safely test features without affecting real users.')
    
  } catch (error) {
    console.error('❌ Error copying data:', error)
    process.exit(1)
  }
}

// Run the copy
copyProdToQA() 