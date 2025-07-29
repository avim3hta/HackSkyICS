# 🚀 Netlify Deployment Guide for ICS Cybersecurity Frontend

## Overview
This guide will help you deploy your React/Vite ICS Cybersecurity frontend to Netlify. The application includes modern UI components, real-time monitoring dashboards, and interactive demo capabilities.

## Prerequisites
- ✅ Node.js 18+ installed
- ✅ npm or yarn package manager
- ✅ Git repository with frontend code
- ✅ Netlify account (free tier available)

## 🛠️ Local Setup & Testing

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Test Local Build
```bash
# Test the build process
npm run build

# Preview the production build locally
npm run preview
```

### Step 3: Verify Build Output
The build should create a `dist/` folder with:
- `index.html` - Main HTML file
- `assets/` - Compiled CSS and JS files
- Static assets and images

## 🌐 Netlify Deployment Methods

### Method 1: Git Integration (Recommended)

#### Step 1: Connect to GitHub
1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"New site from Git"**
3. Choose **GitHub** as your Git provider
4. Authorize Netlify to access your repositories
5. Select your repository: `avim3hta/HackSkyICS`

#### Step 2: Configure Build Settings
```
Repository: avim3hta/HackSkyICS
Base directory: frontend
Build command: npm run build
Publish directory: dist
```

#### Step 3: Set Environment Variables
In Netlify dashboard → Site settings → Environment variables:
```
VITE_APP_TITLE=ICS Cybersecurity Platform
VITE_APP_ENV=production
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Step 4: Deploy
1. Click **"Deploy site"**
2. Netlify will automatically build and deploy your site
3. Your site will be available at: `https://your-site-name.netlify.app`

### Method 2: Manual Upload

#### Step 1: Build Locally
```bash
cd frontend
npm run build
```

#### Step 2: Upload to Netlify
1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"New site from Git"** → **"Deploy manually"**
3. Drag and drop the `dist/` folder
4. Your site will be deployed instantly

### Method 3: Netlify CLI

#### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### Step 2: Login to Netlify
```bash
netlify login
```

#### Step 3: Initialize and Deploy
```bash
cd frontend
netlify init
netlify deploy --prod
```

## ⚙️ Configuration Files

### netlify.toml
```toml
[build]
  command = "npm run build"
  publish = "dist"
  
  [build.environment]
    NODE_VERSION = "18"
    NPM_VERSION = "9"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### _redirects
```
/*    /index.html   200
```

## 🔧 Environment Variables

### Required Variables
```bash
VITE_APP_TITLE=ICS Cybersecurity Platform
VITE_APP_ENV=production
```

### Optional Variables (for Supabase integration)
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎯 Custom Domain Setup

### Step 1: Add Custom Domain
1. Go to Netlify Dashboard → Site settings → Domain management
2. Click **"Add custom domain"**
3. Enter your domain name
4. Follow DNS configuration instructions

### Step 2: Configure DNS
Add these DNS records to your domain provider:
```
Type: CNAME
Name: www
Value: your-site-name.netlify.app

Type: A
Name: @
Value: 75.2.60.5
```

## 📊 Performance Optimization

### Build Optimization
- ✅ Vite build optimization enabled
- ✅ Code splitting for better loading
- ✅ Asset compression
- ✅ Tree shaking for unused code

### Netlify Optimizations
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Asset caching
- ✅ Image optimization

## 🔍 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Routing Issues
- Ensure `_redirects` file is in the `public/` folder
- Verify `netlify.toml` has correct redirects
- Check that React Router is configured properly

#### Environment Variables
- Variables must start with `VITE_` to be accessible in the app
- Set variables in Netlify dashboard → Site settings → Environment variables
- Redeploy after adding new variables

### Debug Commands
```bash
# Test build locally
npm run build

# Check build output
ls -la dist/

# Test production build
npm run preview

# Check Netlify CLI
netlify status
```

## 🚀 Post-Deployment

### Step 1: Verify Deployment
1. Check your site URL
2. Test all pages and functionality
3. Verify responsive design
4. Test form submissions (if any)

### Step 2: Set Up Monitoring
1. Enable Netlify Analytics (optional)
2. Set up error tracking
3. Configure uptime monitoring

### Step 3: Continuous Deployment
- Every push to `main` branch will trigger automatic deployment
- Preview deployments for pull requests
- Branch deployments for testing

## 📱 Mobile Optimization

### Responsive Design
- ✅ Tailwind CSS responsive classes
- ✅ Mobile-first design approach
- ✅ Touch-friendly interfaces
- ✅ Optimized for various screen sizes

### Performance
- ✅ Lazy loading for components
- ✅ Optimized images
- ✅ Minimal bundle size
- ✅ Fast loading times

## 🔒 Security Considerations

### Netlify Security Features
- ✅ Automatic HTTPS
- ✅ Security headers configured
- ✅ Content Security Policy
- ✅ XSS protection

### Application Security
- ✅ Environment variables for sensitive data
- ✅ Input validation
- ✅ Secure API calls
- ✅ Error handling

## 📈 Analytics & Monitoring

### Netlify Analytics
1. Go to Site settings → Analytics
2. Enable **"Netlify Analytics"**
3. View traffic, performance, and user behavior

### Custom Analytics
- Google Analytics integration
- Custom event tracking
- Performance monitoring
- Error tracking

## 🎯 Success Checklist

- ✅ [ ] Local build successful
- ✅ [ ] Netlify deployment completed
- ✅ [ ] Custom domain configured (optional)
- ✅ [ ] Environment variables set
- ✅ [ ] All pages accessible
- ✅ [ ] Responsive design working
- ✅ [ ] Forms and interactions functional
- ✅ [ ] Performance optimized
- ✅ [ ] Security headers configured
- ✅ [ ] Analytics enabled (optional)

## 🆘 Support Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Router Deployment](https://reactrouter.com/en/main/start/overview#deployment)
- [Netlify Support](https://www.netlify.com/support/)

## 🎉 Deployment Complete!

Your ICS Cybersecurity frontend is now live on Netlify with:
- ✅ Modern React/TypeScript application
- ✅ Professional UI components
- ✅ Real-time monitoring capabilities
- ✅ Mobile-responsive design
- ✅ Global CDN and HTTPS
- ✅ Automatic deployments

**Your site URL**: `https://your-site-name.netlify.app` 