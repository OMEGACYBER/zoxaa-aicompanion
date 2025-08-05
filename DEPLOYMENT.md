# 🚀 ZOXAA Deployment Guide

This guide will help you deploy ZOXAA to GitHub and Vercel.

## 📋 Prerequisites

1. **GitHub Account** - Create a new repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **OpenAI API Key** - Get from [platform.openai.com](https://platform.openai.com)
4. **Supabase Project** - Already configured in the project

## 🔧 Step 1: GitHub Setup

### 1.1 Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `zoxaa` or `zoxaa-ai`
3. Make it public or private (your choice)
4. **Don't** initialize with README, .gitignore, or license (we already have these)

### 1.2 Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: ZOXAA AI Cognitive Partner"

# Add remote origin (replace with your repo URL)
git remote add origin https://github.com/yourusername/zoxaa.git

# Push to GitHub
git push -u origin main
```

## 🌐 Step 2: Vercel Deployment

### 2.1 Deploy Frontend & Backend Together

**Important**: This project uses Vercel API routes for the backend, not a separate server.

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository you just created

2. **Configure Project Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Environment Variables**
   Add these environment variables in Vercel:
   ```
   OPENAI_API_KEY=your-actual-openai-api-key-here
   VITE_SUPABASE_URL=https://bwenopgoshivacvehcla.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3ZW5vcGdvc2hpdmFjdmVoY2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTAxMzksImV4cCI6MjA2ODY2NjEzOX0.RtTh6nbQtyyNvwZNIMfLazVouBoqTcG9Ps12jj8-Dvo
   ```

   **Important**: 
   - The `VITE_BACKEND_URL` is NOT needed for Vercel deployment
   - API routes are served from the same domain as the frontend
   - The `/server` folder is for local development only

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### 2.2 API Routes (Backend)

The backend is configured as Vercel API routes in the `/api` folder:

- `/api/chat.js` - Chat completion endpoint
- `/api/tts.js` - Text-to-speech endpoint  
- `/api/health.js` - Health check endpoint
- `/api/test.js` - Debug endpoint for testing

These will be automatically deployed with your frontend.

### 2.3 Environment Variables

**Only these environment variables are needed:**
```
OPENAI_API_KEY=your-actual-openai-api-key-here
VITE_SUPABASE_URL=https://bwenopgoshivacvehcla.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3ZW5vcGdvc2hpdmFjdmVoY2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTAxMzksImV4cCI6MjA2ODY2NjEzOX0.RtTh6nbQtyyNvwZNIMfLazVouBoqTcG9Ps12jj8-Dvo
```

## 🔗 Step 3: Test Deployment

### 3.1 Test API Endpoints

1. **Health Check**: Visit `https://your-project.vercel.app/api/health`
   - Should show API status and environment info

2. **Test API**: Visit `https://your-project.vercel.app/api/test`
   - Should show API key status and environment variables

3. **Frontend**: Visit your main domain
4. **Authentication**: Test sign up/sign in
5. **Voice Chat**: Test voice functionality

### 3.2 Debug API Key Issues

If you're having API key issues:

1. **Check the test endpoint**: `/api/test` will show if the API key is loaded
2. **Verify in Vercel**: Go to your project settings → Environment Variables
3. **Check the format**: API key should start with `sk-`
4. **Redeploy**: Sometimes you need to redeploy after adding environment variables

## 🛠️ Step 4: Custom Domain (Optional)

1. **Add Custom Domain**
   - In Vercel dashboard, go to your project
   - Click "Settings" → "Domains"
   - Add your custom domain (e.g., `zoxaa.com`)

2. **Configure DNS**
   - Add the CNAME record provided by Vercel
   - Wait for DNS propagation (up to 24 hours)

## 🔒 Step 5: Security & Environment

### 5.1 Environment Variables Checklist

Make sure these are set in Vercel:
- ✅ `OPENAI_API_KEY` (for backend API routes)
- ✅ `VITE_SUPABASE_URL` (for frontend)
- ✅ `VITE_SUPABASE_ANON_KEY` (for frontend)

### 5.2 Security Best Practices

1. **Never commit `.env` files**
2. **Use environment variables for all secrets**
3. **Enable Vercel's security features**
4. **Set up proper CORS if needed**

## 📊 Step 6: Monitoring & Analytics

### 6.1 Vercel Analytics
- Enable Vercel Analytics in your project
- Monitor performance and user behavior

### 6.2 Error Tracking
- Consider adding Sentry or similar error tracking
- Monitor API errors and user issues

## 🚀 Step 7: Production Checklist

Before going live, verify:

- [ ] Frontend loads correctly
- [ ] Authentication works
- [ ] Voice chat functions
- [ ] API endpoints respond
- [ ] Environment variables are set
- [ ] Custom domain configured (if using)
- [ ] SSL certificate is active
- [ ] Performance is acceptable

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (use 18+)
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **API Errors**
   - Verify OpenAI API key is correct
   - Check environment variables are set
   - Test API endpoints directly
   - Use `/api/test` to debug environment variables

3. **Voice Issues**
   - Ensure HTTPS is enabled (required for microphone)
   - Check browser permissions
   - Test on different browsers

4. **Authentication Issues**
   - Verify Supabase configuration
   - Check redirect URLs
   - Test sign up/sign in flow

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Review browser console for errors
3. Test locally first
4. Check environment variables
5. Verify API endpoints
6. Use `/api/test` endpoint to debug

## 🎉 Success!

Your ZOXAA AI Cognitive Partner is now live! 

**Next Steps:**
- Share your deployment URL
- Monitor usage and performance
- Gather user feedback
- Plan future features

---

**Built with ❤️ by the ZOXAA team** 