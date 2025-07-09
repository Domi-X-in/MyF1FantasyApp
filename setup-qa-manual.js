const fs = require('fs')
const path = require('path')

console.log('🚀 Manual QA Supabase Setup')
console.log('============================')
console.log('')
console.log('This script will help you set up your QA Supabase environment manually.')
console.log('')

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local')
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!')
  console.log('')
  console.log('Please create a .env.local file with the following content:')
  console.log('')
  console.log('# Production Environment')
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key')
  console.log('')
  console.log('# QA Environment')
  console.log('NEXT_PUBLIC_ENVIRONMENT=qa')
  console.log('NEXT_PUBLIC_SUPABASE_URL_QA=https://your-qa-project.supabase.co')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY_QA=your_qa_anon_key')
  console.log('')
  process.exit(1)
}

console.log('✅ .env.local file found')
console.log('')

// Read and parse .env.local
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=')
    if (key && valueParts.length > 0) {
      envVars[key] = valueParts.join('=').replace(/^["']|["']$/g, '')
    }
  }
})

// Check for required QA variables
const qaUrl = envVars.NEXT_PUBLIC_SUPABASE_URL_QA
const qaKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY_QA

if (!qaUrl || !qaKey) {
  console.log('❌ QA environment variables not found in .env.local!')
  console.log('')
  console.log('Please add these variables to your .env.local file:')
  console.log('NEXT_PUBLIC_SUPABASE_URL_QA=https://your-qa-project.supabase.co')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY_QA=your_qa_anon_key')
  console.log('')
  process.exit(1)
}

console.log('✅ QA environment variables found')
console.log('')

// Extract project reference
const projectRef = qaUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
if (!projectRef) {
  console.log('❌ Invalid QA Supabase URL format')
  console.log('URL should be: https://your-project-ref.supabase.co')
  process.exit(1)
}

console.log(`📋 QA Project Reference: ${projectRef}`)
console.log('')

// Check if schema file exists
const schemaPath = path.join(__dirname, 'supabase-schema.sql')
if (!fs.existsSync(schemaPath)) {
  console.log('❌ supabase-schema.sql file not found!')
  process.exit(1)
}

console.log('✅ Schema file found')
console.log('')

console.log('📋 Manual Setup Instructions:')
console.log('============================')
console.log('')
console.log('1. Go to your QA Supabase project dashboard:')
console.log(`   https://supabase.com/dashboard/project/${projectRef}`)
console.log('')
console.log('2. Navigate to SQL Editor')
console.log('')
console.log('3. Copy the contents of supabase-schema.sql and paste it into the SQL Editor')
console.log('')
console.log('4. Click "Run" to execute the schema')
console.log('')
console.log('5. Verify the setup by checking:')
console.log('   - Table Editor → All tables should be created')
console.log('   - Authentication → Settings should be configured')
console.log('')
console.log('6. Test your QA environment:')
console.log('   npm run dev')
console.log('')
console.log('7. Check the browser console for environment logs')
console.log('')

// Show the schema content
console.log('📄 Schema content to copy:')
console.log('============================')
console.log('')
const schema = fs.readFileSync(schemaPath, 'utf8')
console.log(schema)
console.log('============================')
console.log('')

console.log('✅ Manual setup instructions completed!')
console.log('')
console.log('💡 Tip: You can also use the Supabase CLI for automated setup:')
console.log('   npm install -g supabase')
console.log('   npm run setup:qa:cli') 