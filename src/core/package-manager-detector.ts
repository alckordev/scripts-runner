import * as path from 'path';
import * as fs from 'fs';
import { PackageManager } from '../models/package-manager';
import { IConfigurationService } from '../services/configuration-service';
import { Logger } from '../utils/logger';
import { isWithinRoot } from '../utils/path-utils';

/**
 * Interface for package manager detector
 */
export interface IPackageManagerDetector {
  detect(packagePath: string, workspaceRoot?: string): PackageManager;
}

const LOCK_FILES: Array<{ file: string; manager: PackageManager }> = [
  { file: 'pnpm-lock.yaml', manager: PackageManager.PNPM },
  { file: 'yarn.lock', manager: PackageManager.YARN },
  { file: 'bun.lock', manager: PackageManager.BUN },
  { file: 'bun.lockb', manager: PackageManager.BUN },
  { file: 'package-lock.json', manager: PackageManager.NPM },
];

/**
 * Implementation of package manager detector
 */
export class PackageManagerDetector implements IPackageManagerDetector {
  constructor(private readonly configService: IConfigurationService) {}

  /**
   * Detects the package manager from lock files in `packagePath`.
   * When `workspaceRoot` is provided, walks up until that root if no local lock file exists.
   */
  detect(packagePath: string, workspaceRoot?: string): PackageManager {
    if (!this.configService.shouldAutoDetect()) {
      const defaultPM = this.configService.getDefaultPackageManager();
      Logger.debug(`Auto-detection disabled, using: ${defaultPM}`);
      return defaultPM;
    }

    const startDir = path.resolve(packagePath);
    const rootDir = workspaceRoot ? path.resolve(workspaceRoot) : startDir;
    let current = startDir;

    while (true) {
      const detected = this.detectInDirectory(current);
      if (detected) {
        return detected;
      }

      if (current === rootDir || !isWithinRoot(rootDir, current)) {
        break;
      }

      const parent = path.dirname(current);
      if (parent === current) {
        break;
      }

      current = parent;
    }

    const defaultPM = this.configService.getDefaultPackageManager();
    Logger.info(`No lock file found, using default: ${defaultPM}`);
    return defaultPM;
  }

  /**
   * Detects a package manager from lock files in a single directory
   */
  private detectInDirectory(directory: string): PackageManager | undefined {
    for (const { file, manager } of LOCK_FILES) {
      const lockFilePath = path.join(directory, file);
      if (fs.existsSync(lockFilePath)) {
        Logger.info(`Package manager detected: ${manager} (${file}) in ${directory}`);
        return manager;
      }
    }

    return undefined;
  }
}
