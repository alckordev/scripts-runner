/**
 * Represents a script defined in package.json
 */
export interface Script {
  name: string;
  command: string;
  /** Absolute directory that contains the package.json defining this script */
  packageDir: string;
  /** Path relative to the workspace folder (`.` for the workspace root) */
  relativePath: string;
}
