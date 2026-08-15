# Publishing Checklist

> **Note**: This project now uses GitHub Actions for automated publishing. See [DEPLOYMENT.md](.github/DEPLOYMENT.md) for automated deployment setup. The manual steps below are still valid if you prefer to publish manually.

## ✅ Pre-Publishing Requirements

### Required Files

- [x] `package.json` - Complete with all required fields
- [x] `README.md` - Comprehensive documentation
- [x] `CHANGELOG.md` - Version history
- [x] `LICENSE` - MIT License
- [x] `icon.png` - 128x128px in `images/` folder
- [x] `.vscodeignore` - Excludes unnecessary files

### package.json Requirements

- [x] `name` - Unique identifier
- [x] `displayName` - Human-readable name
- [x] `description` - Clear description
- [x] `version` - Semantic version (1.1.0)
- [x] `publisher` - Publisher ID (alckordev)
- [x] `engines.vscode` - Minimum VS Code version
- [x] `icon` - Path to icon file
- [x] `repository` - GitHub repository URL
- [x] `bugs` - Issues URL
- [x] `homepage` - Homepage URL
- [x] `categories` - Extension category
- [x] `keywords` - Search keywords
- [x] `main` - Entry point (./out/extension.js)

### Code Quality

- [x] TypeScript compiles without errors
- [x] ESLint passes without errors
- [x] All imports resolve correctly
- [x] Extension activates correctly
- [x] All commands work as expected

### Testing

- [x] Extension loads in Extension Development Host
- [x] Scripts display correctly in sidebar
- [x] Script execution works
- [x] Package manager detection works
- [x] Multi-workspace support works
- [x] Nested `package.json` packages appear in the sidebar
- [x] Scripts from nested packages run with the correct `cwd`
- [x] File watcher updates correctly

## 📦 Publishing Steps

### 1. Install VSCE (VS Code Extension Manager)

```bash
npm install -g @vscode/vsce
```

### 2. Create Azure DevOps Publisher

1. Go to https://marketplace.visualstudio.com/manage
2. Sign in with Microsoft account
3. Create new publisher with ID: `alckordev`
4. Verify publisher ID matches `package.json`

### 3. Generate Personal Access Token (PAT)

1. Go to Azure DevOps → User Settings → Personal Access Tokens
2. Create new token with scope: **Marketplace (Manage)**
3. Save the token securely

### 4. Login to VSCE

```bash
vsce login alckordev
# Enter your PAT when prompted
```

### 5. Package Extension

```bash
# From project root
vsce package
```

This creates `quick-scripts-runner-1.1.0.vsix`

### 6. Test Package Locally (Optional)

```bash
code --install-extension quick-scripts-runner-1.1.0.vsix
cursor --install-extension quick-scripts-runner-1.1.0.vsix
```

### 7. Publish to VS Code Marketplace

```bash
vsce publish --no-yarn
```

Or publish with version increment:

```bash
vsce publish minor  # 1.1.0 -> 1.2.0
vsce publish patch  # 1.1.0 -> 1.1.1
```

### 8. Publish to Cursor (Open VSX)

Cursor does **not** use the VS Code Marketplace. It indexes third-party extensions from [Open VSX](https://open-vsx.org/) through its own marketplace proxy.

1. Sign in at https://open-vsx.org with GitHub
2. Create an access token from your Open VSX profile
3. Create the publisher namespace if it does not exist:

```bash
npx ovsx create-namespace alckordev -p <OPEN_VSX_TOKEN>
```

4. Publish the same VSIX:

```bash
npx ovsx publish quick-scripts-runner-1.1.0.vsix -p <OPEN_VSX_TOKEN>
```

5. Confirm the listing at https://open-vsx.org/extension/alckordev/quick-scripts-runner
6. In Cursor, search for `alckordev.quick-scripts-runner`. Indexing can take a few minutes; use **Developer: Reload Window** if it does not appear immediately.

Keep the same extension ID (`alckordev.quick-scripts-runner`) on both marketplaces.

### Automated release

Preferred path: tag the version and let GitHub Actions build the VSIX. Publishing waits for your approval in the **Prod** environment (see [.github/DEPLOYMENT.md](.github/DEPLOYMENT.md)):

```bash
git tag v1.1.0
git push origin v1.1.0
```

Then open **Actions** → **Publish Extension** → **Review deployments** → **Approve**.

Required **Prod** environment secrets: `VS_MARKETPLACE_TOKEN`, `OPEN_VSX_TOKEN`. Enable **Required reviewers** on that environment so the publish job cannot start without your approval.

## ⚠️ Important Notes

- **Publisher ID**: Must match exactly in `package.json` and Azure DevOps
- **Version**: Must follow semantic versioning (major.minor.patch)
- **Repository**: Must be publicly accessible
- **Icon**: Must be exactly 128x128px PNG
- **CHANGELOG**: Should have real dates (not placeholders)

## 🔍 Pre-Publish Verification

Run these commands to verify everything:

```bash
# Compile
pnpm run compile

# Lint
pnpm run lint

# Package (dry run)
vsce package --no-yarn

# Check package contents
vsce ls
```

## 📝 Post-Publishing

1. Verify extension appears in Marketplace
2. Test installation from Marketplace
3. Monitor reviews and issues
4. Update CHANGELOG.md for future releases
5. Update version in package.json for next release
