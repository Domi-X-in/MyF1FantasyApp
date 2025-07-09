# QA Supabase Environment Setup Guide

This guide will help you set up a QA environment in Supabase to match your GitHub and Vercel QA setup.

## Prerequisites

- Supabase account
- Access to your production Supabase project
- Node.js installed locally

## Step 1: Create QA Supabase Project

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Click "New Project"**
3. **Fill in the project details:**
   - **Name:** `my-f1-fantasy-qa` (or your preferred name)
   - **Database Password:** Generate a strong password
   - **Region:** Choose the same region as your production project
4. **Click "Create new project"**
5. **Wait for the project to be created** (this may take a few minutes)

## Step 2: Get QA Project Credentials

1. **In your QA project dashboard, go to Settings → API**
2. **Copy the following values:**
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

## Step 3: Set Up Environment Variables

### Local Development

Create or update your `.env.local` file:

```bash
# Production Environment (default)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key

# QA Environment
NEXT_PUBLIC_ENVIRONMENT=qa
NEXT_PUBLIC_SUPABASE_URL_QA=https://your-qa-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_QA=your_qa_anon_key
```

### Vercel QA Environment

1. **Go to your Vercel project dashboard**
2. **Navigate to Settings → Environment Variables**
3. **Add the following variables for the QA environment:**
   - `NEXT_PUBLIC_ENVIRONMENT` = `qa`
   - `NEXT_PUBLIC_SUPABASE_URL_QA` = `your_qa_project_url`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY_QA` = `your_qa_anon_key`

## Step 4: Deploy Schema to QA

Run the setup script to deploy your database schema to the QA environment:

```bash
npm run setup:qa
```

This script will:
- Read your `supabase-schema.sql` file
- Execute all SQL statements in your QA database
- Set up tables, indexes, triggers, and policies
- Create all necessary functions

## Step 5: Verify Setup

1. **Check your QA Supabase dashboard:**
   - Go to Table Editor
   - Verify all tables are created: `users`, `races`, `predictions`, `password_reset_requests`
   - Check that indexes are created
   - Verify RLS policies are in place

2. **Test locally:**
   ```bash
   npm run dev
   ```
   - Check the console for environment logs
   - Verify the app connects to QA database

## Step 6: Seed QA Data (Optional)

You can optionally seed your QA database with test data:

1. **Go to your QA Supabase dashboard**
2. **Use the SQL Editor to insert test data**
3. **Or create a separate seed script for QA**

## Environment Switching

### Local Development
- **QA Mode:** Set `NEXT_PUBLIC_ENVIRONMENT=qa` in `.env.local`
- **Production Mode:** Set `NEXT_PUBLIC_ENVIRONMENT=prod` or remove the variable

### Vercel Deployment
- **QA Branch:** Vercel will automatically use QA environment variables
- **Main Branch:** Vercel will use production environment variables

## Troubleshooting

### Common Issues

1. **"QA environment variables not found"**
   - Ensure all QA environment variables are set correctly
   - Check for typos in variable names

2. **"Permission denied" errors**
   - Verify your QA project credentials are correct
   - Check that your QA project is active

3. **Schema deployment fails**
   - Check the SQL syntax in `supabase-schema.sql`
   - Verify your QA project has the necessary permissions

### Debug Mode

The Supabase client will log the current environment in development mode. Check your browser console for:
```
Supabase Environment: QA
Supabase URL: https://your-qa-project.supabase.co
```

## Security Notes

- **Never commit environment variables** to version control
- **Use different API keys** for QA and production
- **Regularly rotate** your API keys
- **Monitor usage** in both environments

## Next Steps

1. **Set up automated testing** for your QA environment
2. **Create a data migration strategy** between environments
3. **Set up monitoring** for both QA and production databases
4. **Document any environment-specific configurations**

## Support

If you encounter issues:
1. Check the Supabase documentation
2. Review the error logs in your QA project dashboard
3. Verify all environment variables are correctly set 