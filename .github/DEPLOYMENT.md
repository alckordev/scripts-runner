# Automated Deployment Guide

This project uses GitHub Actions to publish the extension to both VS Marketplace (VS Code) and Open VSX Registry (Cursor). A tag or a manual run starts the build; publishing waits for your approval in the **Prod** environment.

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

## GitHub Environment and Secrets

Tokens live in the **Prod** environment (not as repository secrets). The publish job only sees them after you approve the deployment.

1. Go to your GitHub repository
2. Navigate to **Settings** → **Environments** → **Prod**
3. Under **Environment secrets**, confirm:
   - `VS_MARKETPLACE_TOKEN` — VS Marketplace PAT from step 1
   - `OPEN_VSX_TOKEN` — Open VSX PAT from step 2
4. Under **Deployment protection rules**, enable **Required reviewers**, add yourself, and click **Save protection rules**

Without required reviewers, the publish job starts as soon as the VSIX is built. With that checkbox enabled, GitHub waits until you click **Review deployments** → **Approve**.

## How It Works

The workflow has two jobs:

1. **Build VSIX** — compiles, lints, and uploads the `.vsix` (no secrets, no approval)
2. **Publish** — uses the **Prod** environment, so it waits for your approval, then publishes with `VS_MARKETPLACE_TOKEN` and `OPEN_VSX_TOKEN`

### Publishing from a tag

The workflow starts when you push a tag that starts with `v` (e.g., `v1.0.0`, `v1.1.0`):

```bash
git tag v1.1.0
git push origin v1.1.0
```

Then:

1. Open the **Actions** tab and select the running **Publish Extension** workflow
2. Wait until **Build VSIX** is green
3. Click **Review deployments**, select **Prod**, and **Approve**
4. The publish job releases to VS Marketplace, Open VSX, and GitHub Releases

**Note**: Node.js 24 is used. If a version already exists in a marketplace, that step is treated as success (not failure).

### Manual publishing

You can also trigger the workflow without a tag:

1. Go to **Actions** tab in GitHub
2. Select **Publish Extension** workflow
3. Click **Run workflow**
4. Select the branch and click **Run workflow**
5. Approve the **Prod** deployment when the build finishes

A GitHub Release is created only when the run was started by a tag.

## Workflow Steps

The `publish.yml` workflow:

1. ✅ Checks out the repository
2. ✅ Sets up Node.js 24 and pnpm 10.25.0
3. ✅ Installs dependencies with frozen lockfile
4. ✅ Compiles TypeScript
5. ✅ Runs linting (non-blocking)
6. ✅ Packages the extension as `.vsix`
7. ✅ Uploads `.vsix` as artifact
8. ⏸️ Waits for **Prod** environment approval
9. ✅ Publishes to VS Marketplace
10. ✅ Publishes to Open VSX Registry
11. ✅ Creates GitHub Release (if tag was pushed)

## Version Management

The workflow extracts the version from `package.json`. Make sure to:

1. Update `version` in `package.json` (e.g., `1.1.0`)
2. Update `CHANGELOG.md` with the new version
3. Commit and push changes
4. Create and push a tag: `git tag v1.1.0 && git push origin v1.1.0`

Cursor lists Open VSX extensions after a short indexing delay. If the new version does not appear in Cursor search immediately, reload the window and search for `alckordev.quick-scripts-runner`.

## Troubleshooting

### Publishing Fails

- **Check secrets**: Ensure both `VS_MARKETPLACE_TOKEN` and `OPEN_VSX_TOKEN` exist in **Settings → Environments → Prod** (environment secrets, not repository secrets)
- **Job waiting for approval**: Enable **Required reviewers** on Prod, add yourself, and click **Review deployments** in the workflow run
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
