#!/bin/bash

# ZOXAA GitHub Setup Script
echo "🚀 Setting up ZOXAA for GitHub deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
fi

# Add all files
echo "📦 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: ZOXAA AI Cognitive Partner"

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Please add your GitHub repository URL:"
    echo "Example: https://github.com/yourusername/zoxaa.git"
    read -p "Enter your GitHub repo URL: " repo_url
    
    if [ ! -z "$repo_url" ]; then
        git remote add origin "$repo_url"
        echo "✅ Remote origin added: $repo_url"
    else
        echo "❌ No URL provided. Please add remote manually:"
        echo "git remote add origin YOUR_REPO_URL"
        exit 1
    fi
fi

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://vercel.com"
echo "2. Create new project"
echo "3. Import your GitHub repository"
echo "4. Configure environment variables"
echo "5. Deploy!"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions" 