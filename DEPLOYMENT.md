# GitHub Pages Deployment Troubleshooting

## Current Status
The application is configured for GitHub Pages deployment with the following setup:

### ✅ What's Configured
- **Vite Config**: Proper base path `/p2p-coinflip/` for production
- **GitHub Actions**: Automated build and deployment workflow
- **Asset Handling**: Correct asset paths in build output
- **Error Handling**: Debug scripts to identify loading issues
- **Test Page**: `/test.html` for deployment verification

### 🔧 GitHub Repository Settings Required

**IMPORTANT**: You need to configure GitHub Pages in your repository settings:

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select: **"GitHub Actions"**
5. Save the settings

### 🧪 Testing the Deployment

After deployment, visit these URLs to test:

1. **Main App**: `https://[username].github.io/p2p-coinflip/`
2. **Test Page**: `https://[username].github.io/p2p-coinflip/test.html`

The test page will show:
- ✅ HTML Loading (if page loads)
- ✅ CSS Loading (if styles work)
- ✅ JavaScript (if scripts work)
- Current URL and base path info

### 🐛 Common Issues & Solutions

#### Issue: "404 - Page not found"
**Solution**: Make sure GitHub Pages source is set to "GitHub Actions" in repository settings.

#### Issue: "HTML loads but CSS/JS don't load"
**Symptoms**: Plain HTML without styling, console errors about asset loading
**Solutions**:
1. Check repository name matches exactly: `p2p-coinflip`
2. Verify GitHub Actions workflow completed successfully
3. Check browser console for specific asset URLs that are failing

#### Issue: "Assets have wrong URLs"
**Symptoms**: Console shows 404s for assets with incorrect paths
**Solutions**:
1. Verify the repository name in `vite.config.js` base path
2. Make sure you're using the production build

### 🔍 Debugging Commands

```bash
# Check build output locally
NODE_ENV=production pnpm run build
ls -la dist/
grep -E "(href=|src=)" dist/index.html

# Serve locally to test (requires Python)
cd dist && python -m http.server 8000
# Then visit: http://localhost:8000
```

### 📋 Expected Asset URLs
When working correctly, assets should load from:
- CSS: `https://[username].github.io/p2p-coinflip/assets/index-[hash].css`
- JS: `https://[username].github.io/p2p-coinflip/assets/index-[hash].js`

### 🆘 Still Having Issues?

1. Check GitHub Actions workflow logs for build errors
2. Visit the test page to see specific error messages
3. Check browser console for asset loading errors
4. Verify repository settings have GitHub Pages source set to "GitHub Actions"

## Next Steps
1. Commit and push these changes
2. Wait for GitHub Actions to complete
3. Configure GitHub Pages source in repository settings
4. Test the deployment using the URLs above
