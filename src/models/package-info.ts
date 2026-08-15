import { Script } from './script';

/**
 * A discovered package.json and its scripts
 */
export interface PackageInfo {
  /** Absolute path to the directory containing package.json */
  dir: string;
  /** Path relative to the workspace folder (`.` for the workspace root) */
  relativePath: string;
  scripts: Script[];
}
