const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

async function setupQASupabaseCLI() {
  console.log('🚀 Setting up QA Supabase environment using CLI...')
  
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
  
  try {
    // Check if Supabase CLI is installed
    try {
      execSync('supabase --version', { stdio: 'pipe' })
    } catch (error) {
      console.error('❌ Supabase CLI not found!')
      console.error('Please install Supabase CLI:')
      console.error('npm install -g supabase')
      console.error('or visit: https://supabase.com/docs/guides/cli')
      process.exit(1)
    }
    
    // Extract project reference from URL
    const projectRef = qaUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
    if (!projectRef) {
      console.error('❌ Invalid QA Supabase URL format')
      process.exit(1)
    }
    
    console.log(`📋 Using project: ${projectRef}`)
    
    // Create a temporary config file for the QA project
    const configContent = `
# Supabase configuration for QA environment
project_id = "${projectRef}"
[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323
api_url = "https://${projectRef}.supabase.co"

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326

[storage]
enabled = true
file_size_limit = "50MiB"

[auth]
enabled = true
port = 54327
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600
refresh_token_rotation_enabled = true
security_update_password_require_reauthentication = true

[edge_runtime]
enabled = true
port = 54328
`
    
    const configPath = path.join(__dirname, 'supabase-qa.toml')
    fs.writeFileSync(configPath, configContent)
    
    console.log('📝 Created temporary Supabase config for QA')
    
    // Deploy schema using Supabase CLI
    console.log('⚡ Deploying schema to QA environment...')
    
    const schemaPath = path.join(__dirname, 'supabase-schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Create a temporary migration file
    const migrationDir = path.join(__dirname, 'supabase', 'migrations')
    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true })
    }
    
    const migrationFile = path.join(migrationDir, `${Date.now()}_qa_setup.sql`)
    fs.writeFileSync(migrationFile, schema)
    
    console.log('📄 Created migration file')
    
    // Execute the migration
    try {
      execSync(`supabase db push --project-ref ${projectRef}`, {
        stdio: 'inherit',
        cwd: __dirname
      })
      
      console.log('✅ Schema deployed successfully!')
      
    } catch (error) {
      console.error('❌ Failed to deploy schema via CLI')
      console.error('Falling back to manual SQL execution...')
      
      // Fallback: Use the original setup script
      const { createClient } = require('@supabase/supabase-js')
      const supabase = createClient(qaUrl, qaKey)
      
      // Split and execute SQL statements
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement.trim()) {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
          
          try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement })
            if (error) {
              console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message)
            }
          } catch (err) {
            console.warn(`⚠️  Could not execute statement ${i + 1}:`, err.message)
          }
        }
      }
    }
    
    // Clean up temporary files
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }
    if (fs.existsSync(migrationFile)) {
      fs.unlinkSync(migrationFile)
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
setupQASupabaseCLI() 