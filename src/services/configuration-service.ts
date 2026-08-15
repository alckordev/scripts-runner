import * as vscode from 'vscode';
import { PackageManager } from '../models/package-manager';

/**
 * Default glob patterns skipped while scanning nested package.json files
 */
export const DEFAULT_EXCLUDE_PATTERNS: string[] = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/out/**',
  '**/.next/**',
  '**/coverage/**',
];

/**
 * Interface for configuration service
 */
export interface IConfigurationService {
  getDefaultPackageManager(): PackageManager;
  setDefaultPackageManager(pm: PackageManager): Promise<void>;
  shouldAutoDetect(): boolean;
  shouldScanSubfolders(): boolean;
  getExcludePatterns(): string[];
  getMaxResults(): number;
}

/**
 * Implementation of VS Code configuration service
 */
export class ConfigurationService implements IConfigurationService {
  private readonly configSection = 'quickScriptsRunner';

  /**
   * Gets the default package manager from configuration
   */
  getDefaultPackageManager(): PackageManager {
    const config = vscode.workspace.getConfiguration(this.configSection);
    const defaultPM = config.get<string>('defaultPackageManager', 'npm');

    const packageManager = Object.values(PackageManager).find((pm) => pm === defaultPM);

    return packageManager || PackageManager.NPM;
  }

  /**
   * Sets the default package manager
   */
  async setDefaultPackageManager(pm: PackageManager): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.configSection);
    await config.update('defaultPackageManager', pm, vscode.ConfigurationTarget.Workspace);
  }

  /**
   * Checks if package manager should be auto-detected
   */
  shouldAutoDetect(): boolean {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<boolean>('autoDetectPackageManager', true);
  }

  /**
   * Checks if nested package.json files should be scanned
   */
  shouldScanSubfolders(): boolean {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<boolean>('scanSubfolders', true);
  }

  /**
   * Glob patterns to skip while scanning nested packages
   */
  getExcludePatterns(): string[] {
    const config = vscode.workspace.getConfiguration(this.configSection);
    const patterns = config.get<string[]>('exclude', DEFAULT_EXCLUDE_PATTERNS);

    if (!Array.isArray(patterns) || patterns.length === 0) {
      return [...DEFAULT_EXCLUDE_PATTERNS];
    }

    return patterns.filter((pattern) => typeof pattern === 'string' && pattern.length > 0);
  }

  /**
   * Maximum number of package.json files to include when scanning subfolders
   */
  getMaxResults(): number {
    const config = vscode.workspace.getConfiguration(this.configSection);
    const maxResults = config.get<number>('maxResults', 50);

    if (typeof maxResults !== 'number' || Number.isNaN(maxResults)) {
      return 50;
    }

    return Math.max(1, Math.floor(maxResults));
  }
}
