# Security Guidelines

## 🔒 Environment Variables

### Required Environment Variables
All sensitive configuration should be stored in environment variables, never hardcoded in source code.

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/poligap?retryWrites=true&w=majority
DB_NAME=poligap

# Fallback User Configuration (Development Only)
FALLBACK_USER_ID=your_user_id_here
FALLBACK_USER_EMAIL=your_email@example.com
FALLBACK_USER_NAME=Your Name

# API Keys
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
PORTKEY_API_KEY=your_portkey_api_key

# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your_bucket_name
```

## 🚫 Never Commit These Items

- Real MongoDB connection strings with credentials
- API keys and tokens
- Personal email addresses or user IDs
- AWS credentials
- Any `.env` files (except `.env.example`)

## ✅ Security Best Practices

### 1. Environment Configuration
- Use `.env.example` as a template
- Copy to `.env` and fill with real values
- Never commit `.env` files to version control

### 2. Database Security
- Use environment variables for all database connections
- Implement proper authentication and authorization
- Use connection pooling and timeouts

### 3. API Security
- Validate all input parameters
- Implement rate limiting
- Use proper error handling (don't expose sensitive data)
- Implement proper authentication checks

### 4. Development Security
- Use fallback configurations for development
- Never hardcode production credentials
- Regularly rotate API keys and passwords

## 🔧 Setup Instructions

1. **Copy Environment Template**
   ```bash
   cp .env.example .env
   ```

2. **Configure Your Environment**
   - Replace all placeholder values with real credentials
   - Ensure MongoDB URI points to your actual cluster
   - Set up proper fallback user configuration

3. **Verify Security**
   - Run `git status` to ensure `.env` is not tracked
   - Check that no credentials are hardcoded in source files
   - Test with environment variables only

## 🚨 Security Incident Response

If credentials are accidentally committed:

1. **Immediately rotate all exposed credentials**
2. **Remove from git history** using `git filter-branch` or BFG Repo-Cleaner
3. **Update all affected systems** with new credentials
4. **Review access logs** for any unauthorized usage

## 📋 Security Checklist

- [ ] All credentials moved to environment variables
- [ ] No hardcoded personal information in source code
- [ ] `.env` files properly gitignored
- [ ] API endpoints implement proper authentication
- [ ] Error messages don't expose sensitive data
- [ ] Regular security audits performed
- [ ] Dependencies regularly updated

## 🔍 Security Scanning

This project uses SonarQube for security scanning:

```bash
# Run security scan
npx sonarqube-scanner
```

Regular scans help identify:
- Hardcoded credentials
- Security vulnerabilities
- Code quality issues
- Potential security hotspots

## 📞 Contact

For security concerns or to report vulnerabilities, please contact the development team immediately.
