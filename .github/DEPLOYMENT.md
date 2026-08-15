# Automated Deployment Guide

This project uses GitHub Actions to automatically publish the extension to both VS Marketplace (VS Code) and Open VSX Registry (Cursor) when a new tag is created.

## Prerequisites

Before setting up automated deployment, you need to obtain Personal Access Tokens (PATs) for both marketplaces.

### 1. VS Marketplace Token

1. Go to [Azure DevOps](https://dev.azure.com/)
2. Sign in with your Microsoft account
3. Navigate to **User Settings** → **Personal Access Tokens**
4. Click **New Token**
5. Configure:
   - **Name**: `VS Marketplace Token`
   - **Organization**: All accessible organizations
   - **Expiration**: Set as needed (or leave blank for no expiration)
   - **Scopes**: Select **Marketplace (Manage)**
6. Click **Create** and **copy the token** (you won't be able to see it again)

### 2. Open VSX Registry Token

1. Go to [Open VSX Registry](https://open-vsx.org/)
2. Sign in with your GitHub account
3. Navigate to your profile → **Access Tokens**
4. Click **Create Token**
5. Give it a name (e.g., `GitHub Actions`)
6. Click **Create** and **copy the token**

## GitHub Secrets Configuration

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:
   - **Name**: `VS_MARKETPLACE_TOKEN`
     - **Value**: Your VS Marketplace PAT from step 1

   - **Name**: `OPEN_VSX_TOKEN`
     - **Value**: Your Open VSX Registry PAT from step 2

## How It Works

### Automatic Publishing

The workflow automatically triggers when you push a tag that starts with `v` (e.g., `v1.0.0`, `v1.0.1`):

**Note**: The workflow uses Node.js 24 and will automatically handle cases where a version already exists in the marketplace (treating it as success, not failure).

```bash
# Create and push a tag
git tag v1.0.1
git push origin v1.0.1
```

### Manual Publishing

You can also trigger the workflow manually:

1. Go to **Actions** tab in GitHub
2. Select **Publish Extension** workflow
3. Click **Run workflow**
4. Select the branch and click **Run workflow**

## Workflow Steps

The `publish.yml` workflow:

1. ✅ Checks out the repository
2. ✅ Sets up Node.js 24 and pnpm 10.25.0
3. ✅ Installs dependencies with frozen lockfile
4. ✅ Compiles TypeScript
5. ✅ Runs linting (non-blocking)
6. ✅ Packages the extension as `.vsix`
7. ✅ Publishes to VS Marketplace
8. ✅ Publishes to Open VSX Registry
9. ✅ Uploads `.vsix` as artifact
10. ✅ Creates GitHub Release (if tag was pushed)

## Version Management

The workflow extracts the version from `package.json`. Make sure to:

1. Update `version` in `package.json` (e.g., `1.1.0`)
2. Update `CHANGELOG.md` with the new version
3. Commit and push changes
4. Create and push a tag: `git tag v1.1.0 && git push origin v1.1.0`

Cursor lists Open VSX extensions after a short indexing delay. If the new version does not appear in Cursor search immediately, reload the window and search for `alckordev.quick-scripts-runner`.

## Troubleshooting

### Publishing Fails

- **Check secrets**: Ensure both `VS_MARKETPLACE_TOKEN` and `OPEN_VSX_TOKEN` are set correctly
- **Check token permissions**: VS Marketplace token needs "Marketplace (Manage)" scope
- **Check version**: Ensure version in `package.json` is higher than the last published version
- **Check logs**: Review the GitHub Actions logs for specific error messages

### Version Already Exists

The workflow automatically handles the case where a version already exists in the marketplace:

- ✅ **If version already exists**: The workflow will detect this and treat it as a success (not an error)
- ✅ **Workflow continues**: Even if one marketplace already has the version, it will still try to publish to the other
- ✅ **No workflow failure**: The workflow will complete successfully if the version already exists

If you intentionally want to republish a version, you'll need to:

1. Update the version in `package.json` to a higher version
2. Update `CHANGELOG.md`
3. Commit and push
4. Create a new tag with the updated version

### Build Fails

- Ensure all dependencies are in `package.json` (not just `devDependencies`)
- Check that `tsconfig.json` is configured correctly
- Verify that all TypeScript files compile without errors

## Security Notes

- **Never commit tokens**: Always use GitHub Secrets
- **Rotate tokens periodically**: Update tokens if compromised
- **Use least privilege**: Only grant necessary permissions to tokens
- **Monitor usage**: Check marketplace dashboards for unexpected activity
