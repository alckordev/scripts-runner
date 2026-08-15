# Change Log

All notable changes to the "Quick Scripts Runner" extension will be documented in this file.

## [1.1.0] - 2026-08-15

### Added

- Recursive scan of nested `package.json` files so scripts from subfolders (monorepos, microfrontends) appear in the sidebar
- Settings to control nested discovery:
  - `quickScriptsRunner.scanSubfolders`: enable or disable subfolder scanning (default: `true`)
  - `quickScriptsRunner.exclude`: glob patterns skipped while scanning (default includes `node_modules`, `.git`, `dist`, `out`, `.next`, `coverage`)
  - `quickScriptsRunner.maxResults`: maximum number of `package.json` files to include (default: `50`)
- Per-package script execution: each script runs with `cwd` set to its own package directory
- Package manager walk-up: if a nested package has no lock file, the detector searches parent folders up to the workspace root
- Support for Bun's text lockfile (`bun.lock`) in addition to `bun.lockb`
- Command Palette QuickPick for **Run Script**, listing `package › script` across discovered packages
- Context menu to open the `package.json` of a specific package or script

### Changed

- Tree view keeps a flat script list when only the workspace root has scripts; nested packages are grouped as package nodes
- Terminal names include the package relative path so `dev` in the root and `dev` in a subpackage do not share a terminal
- Documentation updated for nested packages, new settings, and publishing to VS Marketplace and Cursor (Open VSX)

---

## [1.0.1] - 2026-01-12

### Fixed

- OpenPackageJsonCommand now correctly detects and opens package.json from the active workspace instead of always using the first workspace
- When multiple workspaces have package.json, user can now select which one to open via QuickPick menu

## [1.0.0] - 2026-01-11

### Added

- Initial release of Scripts Runner
- Automatic package manager detection (npm, pnpm, yarn, bun)
- Sidebar view displaying all available scripts from `package.json`
- One-click script execution in integrated terminal
- Status bar indicator showing current package manager
- Auto-refresh when `package.json` or lock files change
- Commands:
  - Run script
  - Refresh scripts list
  - Change package manager
  - Open/create `package.json`
- Configuration options:
  - `quickScriptsRunner.defaultPackageManager`: Set default package manager
  - `quickScriptsRunner.autoDetectPackageManager`: Enable/disable auto-detection
- Multi-workspace support
- File watcher for automatic updates

### Features

- Support for npm, pnpm, yarn, and bun
- Automatic detection based on lock files
- Terminal reuse for same script execution
- Intuitive UI with icons and tooltips

---

## [Unreleased]

### Planned

- Script grouping and organization
- Custom script icons
- Script execution history
- Keyboard shortcuts for quick execution
