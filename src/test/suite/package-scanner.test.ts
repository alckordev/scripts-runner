import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { PackageManager } from '../../models/package-manager';
import { PackageJsonReader } from '../../services/package-json-reader';
import { PackageScanner } from '../../services/package-scanner';
import {
  DEFAULT_EXCLUDE_PATTERNS,
  IConfigurationService,
} from '../../services/configuration-service';

class MockConfigurationService implements IConfigurationService {
  constructor(private readonly scanSubfolders: boolean) {}

  getDefaultPackageManager(): PackageManager {
    return PackageManager.NPM;
  }

  async setDefaultPackageManager(_pm: PackageManager): Promise<void> {
    return;
  }

  shouldAutoDetect(): boolean {
    return true;
  }

  shouldScanSubfolders(): boolean {
    return this.scanSubfolders;
  }

  getExcludePatterns(): string[] {
    return [...DEFAULT_EXCLUDE_PATTERNS];
  }

  getMaxResults(): number {
    return 50;
  }
}

function writePackageJson(dir: string, scripts: Record<string, string>): void {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ scripts }, null, 2));
}

suite('PackageScanner Tests', () => {
  let tempDir: string;

  setup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qsr-scanner-'));
    writePackageJson(tempDir, { dev: 'astro dev' });
    writePackageJson(path.join(tempDir, 'microfrontend', 'mf-sales'), { dev: 'vite' });
    writePackageJson(path.join(tempDir, 'node_modules', 'some-pkg'), { test: 'echo skip' });
  });

  teardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('Should ignore node_modules and keep nested packages', async () => {
    const scanner = new PackageScanner(new PackageJsonReader(), new MockConfigurationService(true));
    const nestedDir = path.join(tempDir, 'microfrontend', 'mf-sales');
    const excludedDir = path.join(tempDir, 'node_modules', 'some-pkg');

    const packages = await scanner.buildPackagesFromDirs(
      tempDir,
      [tempDir, nestedDir, excludedDir],
      DEFAULT_EXCLUDE_PATTERNS
    );

    const relativePaths = packages.map((pkg) => pkg.relativePath);
    assert.ok(relativePaths.includes('.'));
    assert.ok(relativePaths.includes('microfrontend/mf-sales'));
    assert.ok(!relativePaths.some((relativePath) => relativePath.includes('node_modules')));
  });

  test('Should only scan workspace root when scanSubfolders is false', async () => {
    const scanner = new PackageScanner(
      new PackageJsonReader(),
      new MockConfigurationService(false)
    );
    const workspaceFolder = {
      uri: vscode.Uri.file(tempDir),
      name: 'tmp',
      index: 0,
    } as vscode.WorkspaceFolder;

    const packages = await scanner.findPackages(workspaceFolder);

    assert.strictEqual(packages.length, 1);
    assert.strictEqual(packages[0].relativePath, '.');
    assert.strictEqual(packages[0].scripts[0].name, 'dev');
  });
});
