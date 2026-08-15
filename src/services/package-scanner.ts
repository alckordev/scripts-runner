import * as path from 'path';
import * as vscode from 'vscode';
import { PackageInfo } from '../models/package-info';
import { IConfigurationService } from './configuration-service';
import { IPackageJsonReader } from './package-json-reader';
import { Logger } from '../utils/logger';
import { buildExcludeGlob, isPathExcluded, toPosixRelativePath } from '../utils/path-utils';

/**
 * Discovers package.json files in a workspace folder
 */
export interface IPackageScanner {
  findPackages(workspaceFolder: vscode.WorkspaceFolder): Promise<PackageInfo[]>;
  buildPackagesFromDirs(
    workspaceRoot: string,
    packageDirs: string[],
    excludePatterns: string[]
  ): Promise<PackageInfo[]>;
}

/**
 * Scans a workspace for package.json files, including nested packages
 */
export class PackageScanner implements IPackageScanner {
  constructor(
    private readonly packageJsonReader: IPackageJsonReader,
    private readonly configService: IConfigurationService
  ) {}

  /**
   * Finds packages in a workspace folder according to current settings
   */
  async findPackages(workspaceFolder: vscode.WorkspaceFolder): Promise<PackageInfo[]> {
    const workspaceRoot = workspaceFolder.uri.fsPath;
    const excludePatterns = this.configService.getExcludePatterns();
    const packageDirs = await this.discoverPackageDirs(workspaceFolder);

    return this.buildPackagesFromDirs(workspaceRoot, packageDirs, excludePatterns);
  }

  /**
   * Builds package info from known directories, applying exclude patterns
   */
  async buildPackagesFromDirs(
    workspaceRoot: string,
    packageDirs: string[],
    excludePatterns: string[]
  ): Promise<PackageInfo[]> {
    const uniqueDirs = [...new Set(packageDirs.map((dir) => path.resolve(dir)))];
    const packages: PackageInfo[] = [];

    for (const dir of uniqueDirs) {
      const relativePath = toPosixRelativePath(workspaceRoot, dir);

      if (relativePath !== '.' && isPathExcluded(relativePath, excludePatterns)) {
        Logger.debug(`Skipping excluded package path: ${relativePath}`);
        continue;
      }

      if (!this.packageJsonReader.exists(dir)) {
        continue;
      }

      const scripts = await this.packageJsonReader.readScripts(dir, relativePath);
      packages.push({ dir, relativePath, scripts });
    }

    packages.sort((a, b) => {
      if (a.relativePath === '.') {
        return -1;
      }
      if (b.relativePath === '.') {
        return 1;
      }
      return a.relativePath.localeCompare(b.relativePath);
    });

    Logger.info(`Discovered ${packages.length} package(s) under ${workspaceRoot}`);
    return packages;
  }

  /**
   * Resolves candidate package directories for a workspace folder
   */
  private async discoverPackageDirs(workspaceFolder: vscode.WorkspaceFolder): Promise<string[]> {
    const workspaceRoot = workspaceFolder.uri.fsPath;

    if (!this.configService.shouldScanSubfolders()) {
      Logger.debug(`Subfolder scan disabled, using workspace root: ${workspaceRoot}`);
      return [workspaceRoot];
    }

    const maxResults = this.configService.getMaxResults();
    const excludeGlob = buildExcludeGlob(this.configService.getExcludePatterns());
    const include = new vscode.RelativePattern(workspaceFolder, '**/package.json');
    const uris = await vscode.workspace.findFiles(
      include,
      excludeGlob.length > 0 ? excludeGlob : undefined,
      maxResults
    );

    const dirs = uris.map((uri) => path.dirname(uri.fsPath));

    if (this.packageJsonReader.exists(workspaceRoot) && !dirs.includes(workspaceRoot)) {
      dirs.unshift(workspaceRoot);
    }

    return dirs;
  }
}
