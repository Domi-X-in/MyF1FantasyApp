# Copy Production Data to QA Guide

This guide explains how to copy your production data to the QA environment for realistic testing.

## 🎯 **Why Copy Production Data?**

- **Realistic Testing**: Test with real data structure and relationships
- **Bug Reproduction**: Reproduce issues that occur in production
- **Feature Validation**: Ensure new features work with existing data
- **Performance Testing**: Test with realistic data volumes

## 📋 **Available Options**

### **Option 1: Exact Copy (Full Data)**
```bash
npm run copy:prod-to-qa
```

**What it does:**
- ✅ Copies all production data exactly as-is
- ✅ Preserves all relationships and IDs
- ✅ Maintains all user passwords and sensitive data
- ⚠️ **Warning**: Contains real user data and passwords

**Use when:**
- You need to reproduce exact production issues
- You're testing with real user scenarios
- You have permission to handle sensitive data

### **Option 2: Sanitized Copy (Recommended)**
```bash
npm run copy:prod-to-qa:sanitized
```

**What it does:**
- ✅ Copies production data structure and relationships
- ✅ Sanitizes sensitive information
- ✅ Provides test credentials
- ✅ Marks data as QA/test data
- 🔒 **Secure**: Removes sensitive information

**Use when:**
- You want to test safely without exposing real user data
- You're sharing QA environment with team members
- You want to avoid accidentally using real credentials

## 🔒 **Security Measures in Sanitized Copy**

The sanitized copy applies these security measures:

### **Users Table**
- **Passwords**: Reset to `qa_test_password` for all users
- **Names**: Prefixed with `QA_` (e.g., `John` → `QA_John`)
- **Usernames**: Prefixed with `qa_` (e.g., `john123` → `qa_john123`)
- **Stars**: Reduced by 50% for testing
- **Races Participated**: Reduced by 50% for testing
- **Password Reset Info**: Cleared for security

### **Races Table**
- **Names**: Prefixed with `[QA]` (e.g., `Australian GP` → `[QA] Australian GP`)
- **Cities**: Prefixed with `[QA]` (e.g., `Melbourne` → `[QA] Melbourne`)
- **Completion Status**: All races marked as not completed
- **Results**: Cleared for testing
- **Star Winners**: Cleared for testing

### **Password Reset Requests**
- **Completely Cleared**: No password reset requests copied

## 🚀 **How to Use**

### **Step 1: Ensure Environment Variables**
Make sure your `.env.local` file has all required variables:

```bash
# Production Environment
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key

# QA Environment
NEXT_PUBLIC_SUPABASE_URL_QA=https://your-qa-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_QA=your_qa_anon_key
```

### **Step 2: Run the Copy Script**

**For sanitized copy (recommended):**
```bash
npm run copy:prod-to-qa:sanitized
```

**For exact copy:**
```bash
npm run copy:prod-to-qa
```

### **Step 3: Verify the Copy**
1. **Check QA Dashboard**: Go to your QA Supabase project
2. **Verify Tables**: Check that all tables have data
3. **Test Login**: Use the provided test credentials

## 🔑 **Test Credentials (Sanitized Copy)**

After running the sanitized copy, you can test with:

**Username**: `qa_[original_username]`  
**Password**: `qa_test_password`

**Examples:**
- Original: `john123` → Test: `qa_john123`
- Original: `admin` → Test: `qa_admin`

## 📊 **What Gets Copied**

### **Tables Copied**
- ✅ `users` - All user accounts
- ✅ `races` - All race information
- ✅ `predictions` - All user predictions
- ✅ `password_reset_requests` - (cleared in sanitized copy)

### **Data Relationships**
- ✅ Foreign key relationships preserved
- ✅ User predictions linked to correct users/races
- ✅ All IDs maintained for consistency

## ⚠️ **Important Notes**

### **Before Running**
- ✅ Ensure QA database schema is set up
- ✅ Verify environment variables are correct
- ✅ Make sure you have access to both databases

### **After Running**
- ✅ QA database will be completely replaced
- ✅ Any existing QA data will be lost
- ✅ Test thoroughly before making changes

### **Security Considerations**
- 🔒 **Sanitized copy is recommended** for most use cases
- 🔒 **Exact copy** should only be used when necessary
- 🔒 **Never share** exact copy credentials
- 🔒 **Clear QA data** when testing is complete

## 🔄 **Regular Updates**

To keep QA data fresh, run the copy script regularly:

```bash
# Weekly or before major testing
npm run copy:prod-to-qa:sanitized
```

## 🛠️ **Troubleshooting**

### **Common Issues**

**"Environment variables not found"**
- Check your `.env.local` file
- Ensure all variables are set correctly
- Restart your terminal after changing variables

**"Permission denied" errors**
- Verify your API keys are correct
- Check that both projects are active
- Ensure you have read access to production

**"Foreign key constraint" errors**
- Run the schema setup first: `npm run setup:qa:manual`
- Ensure all tables exist in QA database

**"Data not appearing"**
- Check the console output for errors
- Verify the copy completed successfully
- Check QA dashboard for data

## 📈 **Best Practices**

1. **Use sanitized copy** for most testing scenarios
2. **Run copies regularly** to keep data fresh
3. **Test thoroughly** after each copy
4. **Document any issues** found during testing
5. **Clear sensitive data** when sharing QA environment

## 🎯 **Next Steps**

After copying data:
1. **Test your app** in QA environment
2. **Verify all features** work with the copied data
3. **Test new features** safely
4. **Report any issues** found during testing

Your QA environment is now ready for realistic testing! 🚀 