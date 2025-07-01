# Supabase Setup Guide for F1 Fantasy App

## Overview
This guide will help you set up Supabase as the backend for your F1 Fantasy app, enabling data synchronization across multiple devices.

## Step 1: Create Supabase Project

### 1.1 Sign Up/Login
1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account or login if you already have one
3. Click "New Project"

### 1.2 Create Project
1. **Organization**: Select your organization (create one if needed)
2. **Name**: Enter "f1-fantasy-app" or your preferred name
3. **Database Password**: Create a strong password (save this!)
4. **Region**: Choose the closest region to your users
5. Click "Create new project"

### 1.3 Wait for Setup
- Project setup takes 1-2 minutes
- You'll receive an email when ready

## Step 2: Configure Database Schema

### 2.1 Access SQL Editor
1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New query"

### 2.2 Run Schema Script
1. Copy the entire contents of `supabase-schema.sql`
2. Paste it into the SQL editor
3. Click "Run" to execute the script

### 2.3 Verify Tables
1. Go to "Table Editor" in the sidebar
2. You should see three tables:
   - `users`
   - `races`
   - `predictions`

## Step 3: Get API Credentials

### 3.1 Project Settings
1. In your Supabase dashboard, go to "Settings" → "API"
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **Anon public key** (starts with `eyJ`)

### 3.2 Environment Variables
1. Create a `.env.local` file in your project root
2. Add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Configure Authentication (Optional)

### 4.1 Enable Email Auth
1. Go to "Authentication" → "Providers"
2. Enable "Email" provider
3. Configure any additional settings as needed

### 4.2 Set Up Row Level Security
The schema script already includes RLS policies, but you can customize them:
1. Go to "Authentication" → "Policies"
2. Review and modify policies as needed

## Step 5: Test Configuration

### 5.1 Start Development Server
```bash
npm run dev
```

### 5.2 Test Connection
1. Open your app in the browser
2. Check the browser console for any connection errors
3. Try creating a new user account

### 5.3 Verify Data Sync
1. Create a test user and race
2. Check the Supabase dashboard → "Table Editor"
3. Verify data appears in the tables

## Step 6: Data Migration

### 6.1 Backup Existing Data
Before migrating, ensure you have a backup of your current data:
1. Export localStorage data using browser dev tools
2. Or use the built-in backup feature in the migration utility

### 6.2 Run Migration
1. In your app, go to the Admin tab
2. Look for the "Migrate to Cloud" option
3. Follow the migration wizard
4. Monitor progress in the migration status modal

### 6.3 Verify Migration
1. Check that all users and races were migrated
2. Verify predictions and results are intact
3. Test login with migrated accounts

## Step 7: Production Deployment

### 7.1 Environment Variables
For production, set the same environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 7.2 Deploy
1. Deploy your Next.js app to Vercel, Netlify, or your preferred platform
2. Add environment variables in your hosting platform
3. Test the deployed app

## Troubleshooting

### Common Issues

#### 1. Connection Errors
**Problem**: "Failed to connect to Supabase"
**Solution**: 
- Verify environment variables are correct
- Check if Supabase project is active
- Ensure network connectivity

#### 2. Authentication Errors
**Problem**: "Invalid credentials"
**Solution**:
- Check RLS policies in Supabase
- Verify user table structure
- Check password hashing implementation

#### 3. Migration Failures
**Problem**: "Migration failed"
**Solution**:
- Check browser console for specific errors
- Verify database schema is correct
- Ensure all required tables exist

#### 4. Real-time Not Working
**Problem**: "No real-time updates"
**Solution**:
- Check if real-time is enabled in Supabase
- Verify subscription setup
- Check network connectivity

### Debug Mode
Enable debug logging by adding to your `.env.local`:
```env
NEXT_PUBLIC_DEBUG=true
```

## Security Considerations

### 1. Row Level Security
- All tables have RLS enabled
- Policies restrict access appropriately
- Users can only access their own data

### 2. API Keys
- Never commit `.env.local` to version control
- Use environment variables in production
- Rotate keys regularly

### 3. Password Security
- Passwords are hashed using SHA-256
- Consider upgrading to bcrypt for production
- Implement password strength requirements

## Performance Optimization

### 1. Database Indexes
- Indexes are created on frequently queried columns
- Monitor query performance in Supabase dashboard
- Add additional indexes as needed

### 2. Caching
- Local caching reduces API calls
- Offline queue handles connectivity issues
- Real-time subscriptions minimize polling

### 3. Connection Pooling
- Supabase handles connection pooling automatically
- Monitor connection usage in dashboard
- Adjust pool size if needed

## Monitoring

### 1. Supabase Dashboard
- Monitor API usage and performance
- Check error logs and analytics
- Track database growth

### 2. Application Monitoring
- Monitor real-time subscription health
- Track offline queue processing
- Log migration and sync events

## Cost Management

### 1. Free Tier Limits
- 50,000 monthly active users
- 500MB database storage
- 2GB bandwidth per month

### 2. Usage Monitoring
- Monitor usage in Supabase dashboard
- Set up alerts for approaching limits
- Plan for scaling when needed

## Support

### 1. Supabase Documentation
- [Supabase Docs](https://supabase.com/docs)
- [JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Database Guide](https://supabase.com/docs/guides/database)

### 2. Community
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

## Next Steps

After successful setup:

1. **Test thoroughly** with multiple devices
2. **Monitor performance** and usage
3. **Implement additional features** like:
   - Email notifications
   - Social login
   - Advanced analytics
   - Push notifications

4. **Scale as needed** when approaching limits
5. **Backup regularly** using Supabase backup features 