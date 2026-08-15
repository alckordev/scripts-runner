import * as path from 'path';
import * as fs from 'fs';
import { Script } from '../models/script';
import { Logger } from '../utils/logger';

/**
 * Interface for package.json reader
 */
export interface IPackageJsonReader {
  readScripts(packageDir: string, relativePath?: string): Promise<Script[]>;
  exists(packageDir: string): boolean;
}

/**
 * Implementation of package.json reader
 */
export class PackageJsonReader implements IPackageJsonReader {
  /**
   * Checks if package.json exists in the given directory
   */
  exists(packageDir: string): boolean {
    const packageJsonPath = path.join(packageDir, 'package.json');
    return fs.existsSync(packageJsonPath);
  }

  /**
   * Reads and parses scripts from package.json
   */
  async readScripts(packageDir: string, relativePath = '.'): Promise<Script[]> {
    try {
      const packageJsonPath = path.join(packageDir, 'package.json');

      if (!this.exists(packageDir)) {
        Logger.debug(`package.json not found in: ${packageDir}`);
        return [];
      }

      const content = await fs.promises.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      if (!packageJson.scripts || typeof packageJson.scripts !== 'object') {
        Logger.debug(`No scripts found in package.json at ${packageDir}`);
        return [];
      }

      const scripts: Script[] = Object.entries(packageJson.scripts)
        .filter(([, command]) => typeof command === 'string')
        .map(([name, command]) => ({
          name,
          command: command as string,
          packageDir,
          relativePath,
        }));

      Logger.info(`Found ${scripts.length} scripts in ${relativePath}`);
      return scripts;
    } catch (error) {
      Logger.error('Error reading package.json', error as Error);
      return [];
    }
  }
}
