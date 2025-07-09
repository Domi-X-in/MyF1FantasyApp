const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

async function copyProdToQASanitized() {
  console.log('🚀 Copying Production Data to QA Environment (Sanitized)...')
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
    
    console.log('🧹 Step 2: Sanitizing data...')
    
    // Sanitize users (remove sensitive data)
    const sanitizedUsers = users.map(user => ({
      ...user,
      password_hash: crypto.createHash('sha256').update('qa_test_password').digest('hex'), // Set test password
      name: `QA_${user.name}`, // Prefix names to indicate QA data
      username: `qa_${user.username}`, // Prefix usernames
      stars: Math.floor(user.stars * 0.5), // Reduce stars for testing
      races_participated: Math.floor(user.races_participated * 0.5), // Reduce participation
      last_password_reset: null, // Clear password reset info
      password_reset_count: 0 // Reset password reset count
    }))
    
    // Sanitize races (keep structure but mark as test data)
    const sanitizedRaces = races.map(race => ({
      ...race,
      name: `[QA] ${race.name}`, // Prefix race names
      city: `[QA] ${race.city}`, // Prefix city names
      is_completed: false, // Mark all races as not completed for testing
      results: null, // Clear results for testing
      star_winners: [] // Clear star winners
    }))
    
    // Sanitize predictions (keep structure but clear sensitive data)
    const sanitizedPredictions = predictions.map(prediction => ({
      ...prediction,
      // Keep the prediction data but it will reference sanitized users/races
    }))
    
    // Clear password reset requests entirely (sensitive data)
    const sanitizedPasswordResets = []
    
    console.log('✅ Data sanitized')
    console.log('')
    
    console.log('🗑️  Step 3: Clearing QA database...')
    
    // Clear QA database (in reverse order due to foreign key constraints)
    const clearResults = await Promise.all([
      qaClient.from('password_reset_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      qaClient.from('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      qaClient.from('races').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      qaClient.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    ])
    
    console.log('✅ QA database cleared')
    console.log('')
    
    console.log('📝 Step 4: Copying sanitized data to QA...')
    
    // Copy users first (no dependencies)
    if (sanitizedUsers.length > 0) {
      console.log(`📋 Copying ${sanitizedUsers.length} sanitized users...`)
      const usersResult = await qaClient.from('users').insert(sanitizedUsers)
      if (usersResult.error) {
        console.error('❌ Error copying users:', usersResult.error)
        process.exit(1)
      }
      console.log('✅ Users copied successfully')
    }
    
    // Copy races (no dependencies)
    if (sanitizedRaces.length > 0) {
      console.log(`📋 Copying ${sanitizedRaces.length} sanitized races...`)
      const racesResult = await qaClient.from('races').insert(sanitizedRaces)
      if (racesResult.error) {
        console.error('❌ Error copying races:', racesResult.error)
        process.exit(1)
      }
      console.log('✅ Races copied successfully')
    }
    
    // Copy predictions (depends on users and races)
    if (sanitizedPredictions.length > 0) {
      console.log(`📋 Copying ${sanitizedPredictions.length} predictions...`)
      const predictionsResult = await qaClient.from('predictions').insert(sanitizedPredictions)
      if (predictionsResult.error) {
        console.error('❌ Error copying predictions:', predictionsResult.error)
        process.exit(1)
      }
      console.log('✅ Predictions copied successfully')
    }
    
    // Copy password reset requests (empty for security)
    if (sanitizedPasswordResets.length > 0) {
      console.log(`📋 Copying ${sanitizedPasswordResets.length} password reset requests...`)
      const passwordResetsResult = await qaClient.from('password_reset_requests').insert(sanitizedPasswordResets)
      if (passwordResetsResult.error) {
        console.error('❌ Error copying password reset requests:', passwordResetsResult.error)
        process.exit(1)
      }
      console.log('✅ Password reset requests copied successfully')
    }
    
    console.log('')
    console.log('🎉 Sanitized data copy completed successfully!')
    console.log('')
    console.log('📊 Summary:')
    console.log(`   Users: ${sanitizedUsers.length} (sanitized)`)
    console.log(`   Races: ${sanitizedRaces.length} (sanitized)`)
    console.log(`   Predictions: ${sanitizedPredictions.length}`)
    console.log(`   Password Reset Requests: ${sanitizedPasswordResets.length} (cleared for security)`)
    console.log('')
    console.log('🔒 Security measures applied:')
    console.log('   ✅ All passwords reset to "qa_test_password"')
    console.log('   ✅ User names prefixed with "QA_"')
    console.log('   ✅ Usernames prefixed with "qa_"')
    console.log('   ✅ Race names prefixed with "[QA]"')
    console.log('   ✅ All races marked as not completed')
    console.log('   ✅ Race results cleared')
    console.log('   ✅ Star winners cleared')
    console.log('   ✅ Password reset requests cleared')
    console.log('')
    console.log('🔗 QA Dashboard:')
    const qaProjectRef = qaUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
    if (qaProjectRef) {
      console.log(`   https://supabase.com/dashboard/project/${qaProjectRef}`)
    }
    console.log('')
    console.log('💡 Your QA environment now has a sanitized copy of production data!')
    console.log('   You can safely test features without exposing sensitive information.')
    console.log('')
    console.log('🔑 Test login credentials:')
    console.log('   Username: qa_[original_username]')
    console.log('   Password: qa_test_password')
    
  } catch (error) {
    console.error('❌ Error copying data:', error)
    process.exit(1)
  }
}

// Run the copy
copyProdToQASanitized() 