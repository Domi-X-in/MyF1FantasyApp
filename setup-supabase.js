#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 F1 Fantasy App - Supabase Setup\n');

console.log('This script will help you configure Supabase for your F1 Fantasy app.\n');

console.log('📋 Prerequisites:');
console.log('1. Create a Supabase account at https://supabase.com');
console.log('2. Create a new project in Supabase');
console.log('3. Run the SQL schema from supabase-schema.sql in your Supabase SQL editor\n');

rl.question('Do you have a Supabase project ready? (y/n): ', (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('\n❌ Please create a Supabase project first and then run this script again.');
    rl.close();
    return;
  }

  console.log('\n🔧 Let\'s configure your environment variables...\n');

  rl.question('Enter your Supabase Project URL (starts with https://): ', (url) => {
    if (!url.startsWith('https://')) {
      console.log('❌ Invalid URL. Please enter a valid Supabase project URL.');
      rl.close();
      return;
    }

    rl.question('Enter your Supabase Anon Key (starts with eyJ): ', (key) => {
      if (!key.startsWith('eyJ')) {
        console.log('❌ Invalid key. Please enter a valid Supabase anon key.');
        rl.close();
        return;
      }

      // Create .env.local file
      const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${key}

# Optional: Enable debug mode
# NEXT_PUBLIC_DEBUG=true
`;

      const envPath = path.join(process.cwd(), '.env.local');

      try {
        fs.writeFileSync(envPath, envContent);
        console.log('\n✅ Environment variables configured successfully!');
        console.log(`📁 Created: ${envPath}`);
        
        console.log('\n📋 Next Steps:');
        console.log('1. Run the SQL schema in your Supabase SQL editor:');
        console.log('   - Copy contents of supabase-schema.sql');
        console.log('   - Paste in Supabase SQL Editor and run');
        
        console.log('\n2. Install dependencies:');
        console.log('   npm install');
        
        console.log('\n3. Start the development server:');
        console.log('   npm run dev');
        
        console.log('\n4. Test the app:');
        console.log('   - Open http://localhost:3000');
        console.log('   - Create a new user account');
        console.log('   - Test the migration feature in Admin panel');
        
        console.log('\n🎉 Setup complete! Your F1 Fantasy app is now ready with Supabase integration.');
        
      } catch (error) {
        console.error('❌ Error creating .env.local file:', error.message);
      }

      rl.close();
    });
  });
});

// Handle script interruption
process.on('SIGINT', () => {
  console.log('\n\n❌ Setup cancelled.');
  rl.close();
  process.exit(0);
}); 