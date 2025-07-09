const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function setupQASupabase() {
  console.log('🚀 Setting up QA Supabase environment...')
  
  // Check if QA environment variables are set
  const qaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_QA
  const qaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_QA
  
  if (!qaUrl || !qaKey) {
    console.error('❌ QA environment variables not found!')
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL_QA and NEXT_PUBLIC_SUPABASE_ANON_KEY_QA')
    console.error('')
    console.error('You can set them in your .env.local file or export them in your terminal:')
    console.error('export NEXT_PUBLIC_SUPABASE_URL_QA=https://your-qa-project.supabase.co')
    console.error('export NEXT_PUBLIC_SUPABASE_ANON_KEY_QA=your_qa_anon_key')
    process.exit(1)
  }
  
  // Create Supabase client for QA
  const supabase = createClient(qaUrl, qaKey)
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'supabase-schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('📖 Reading schema file...')
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message)
          // Continue with other statements even if one fails
        }
      }
    }
    
    console.log('✅ QA Supabase setup completed!')
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Add QA environment variables to your .env.local file:')
    console.log('   NEXT_PUBLIC_ENVIRONMENT=qa')
    console.log('   NEXT_PUBLIC_SUPABASE_URL_QA=your_qa_project_url')
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY_QA=your_qa_anon_key')
    console.log('')
    console.log('2. Set the same variables in your Vercel QA environment')
    console.log('')
    console.log('3. Test your QA environment by running: npm run dev')
    
  } catch (error) {
    console.error('❌ Error setting up QA Supabase:', error)
    process.exit(1)
  }
}

// Run the setup
setupQASupabase() 