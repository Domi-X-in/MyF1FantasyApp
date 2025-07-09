# Vercel Environment Variables Setup Guide

This guide will help you configure environment variables in Vercel so that your QA branch points to the QA database instead of production.

## Problem

Your QA branch on Vercel is currently pointing to the production database because environment variables are not properly configured in Vercel. The `.env.local` file is not deployed to Vercel, so environment variables must be set in the Vercel dashboard.

## Solution: Configure Vercel Environment Variables

### Step 1: Access Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `my-f1-fantasy-app` project
3. Navigate to **Settings** → **Environment Variables**

### Step 2: Configure QA Environment Variables

Add the following variables for your QA branch:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_ENVIRONMENT` | `qa` | **Preview** |
| `NEXT_PUBLIC_SUPABASE_URL_QA` | `https://your-qa-project.supabase.co` | **Preview** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_QA` | `your_qa_anon_key` | **Preview** |

**Important:** Select **Preview** environment for these variables. This applies to all branches except main/production.

### Step 3: Configure Production Environment Variables

Add the following variables for your production branch:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_ENVIRONMENT` | `prod` | **Production** |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-prod-project.supabase.co` | **Production** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your_prod_anon_key` | **Production** |

**Important:** Select **Production** environment for these variables. This applies to your main branch.

### Step 4: Get Your QA Supabase Credentials

If you haven't set up your QA Supabase project yet:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project for QA (e.g., `my-f1-fantasy-qa`)
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key

### Step 5: Deploy Schema to QA Database

Run the QA setup script locally to deploy your schema:

```bash
# Set QA environment variables locally
export NEXT_PUBLIC_SUPABASE_URL_QA=https://your-qa-project.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY_QA=your_qa_anon_key

# Run the setup script
node setup-qa-supabase.js
```

### Step 6: Test the Configuration

1. **Deploy your QA branch to Vercel**
2. **Check the deployment logs** to ensure environment variables are loaded
3. **Visit your QA deployment URL** and check the browser console for environment logs
4. **Verify the app connects to QA database** (you should see orange header colors for QA)

## Environment Variable Reference

### QA Environment (Preview)
```
NEXT_PUBLIC_ENVIRONMENT=qa
NEXT_PUBLIC_SUPABASE_URL_QA=https://your-qa-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_QA=your_qa_anon_key
```

### Production Environment (Production)
```
NEXT_PUBLIC_ENVIRONMENT=prod
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
```

## Visual Indicators

Your app will show different colors based on the environment:
- **QA:** Orange header and navigation
- **Production:** Red header and navigation
- **Development:** Blue header and navigation

## Troubleshooting

### Issue: QA branch still pointing to production database

**Solution:**
1. Check that `NEXT_PUBLIC_ENVIRONMENT=qa` is set for **Preview** environment
2. Verify `NEXT_PUBLIC_SUPABASE_URL_QA` and `NEXT_PUBLIC_SUPABASE_ANON_KEY_QA` are set
3. Redeploy the QA branch after adding environment variables

### Issue: Environment variables not loading

**Solution:**
1. Ensure variables are set for the correct environment (Preview vs Production)
2. Check for typos in variable names
3. Redeploy after adding/modifying environment variables

### Issue: QA database not accessible

**Solution:**
1. Verify QA Supabase project is active
2. Check that schema has been deployed to QA database
3. Ensure API keys are correct

## Verification Steps

1. **Check Vercel deployment logs** for environment variable loading
2. **Open browser console** on QA deployment and look for:
   ```
   🌍 Environment Information
   Environment: QA
   Supabase URL: https://your-qa-project.supabase.co
   Is Production: false
   Header Color: bg-orange-600
   ```
3. **Verify visual indicators** (orange header for QA)
4. **Test functionality** to ensure it's using QA data

## Security Notes

- Never commit environment variables to version control
- Use different API keys for QA and production
- Regularly rotate your API keys
- Monitor usage in both environments

## Next Steps

After setting up environment variables:

1. **Test your QA environment** thoroughly
2. **Set up automated testing** for QA
3. **Create a data migration strategy** between environments
4. **Set up monitoring** for both QA and production databases

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables in Vercel dashboard
3. Test locally with `.env.local` file
4. Check Supabase project status and credentials 