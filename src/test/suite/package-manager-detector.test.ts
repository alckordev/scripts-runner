import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PackageManagerDetector } from '../../core/package-manager-detector';
import { PackageManager } from '../../models/package-manager';
import { IConfigurationService } from '../../services/configuration-service';

class MockConfigurationService implements IConfigurationService {
  constructor(
    private readonly autoDetect = true,
    private readonly defaultPm = PackageManager.NPM
  ) {}

  getDefaultPackageManager(): PackageManager {
    return this.defaultPm;
  }

  async setDefaultPackageManager(_pm: PackageManager): Promise<void> {
    return;
  }

  shouldAutoDetect(): boolean {
    return this.autoDetect;
  }

  shouldScanSubfolders(): boolean {
    return true;
  }

  getExcludePatterns(): string[] {
    return [];
  }

  getMaxResults(): number {
    return 50;
  }
}

suite('PackageManagerDetector Tests', () => {
  let tempDir: string;

  setup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qsr-pm-'));
  });

  teardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('Should detect npm by default when no lock files exist', () => {
    const detector = new PackageManagerDetector(new MockConfigurationService());
    const result = detector.detect(path.join(tempDir, 'missing'));
    assert.strictEqual(result, PackageManager.NPM);
  });

  test('Should walk up to the workspace root to find a lock file', () => {
    fs.writeFileSync(path.join(tempDir, 'pnpm-lock.yaml'), '');
    const nestedDir = path.join(tempDir, 'packages', 'app');
    fs.mkdirSync(nestedDir, { recursive: true });

    const detector = new PackageManagerDetector(new MockConfigurationService());
    const result = detector.detect(nestedDir, tempDir);

    assert.strictEqual(result, PackageManager.PNPM);
  });

  test('Should prefer a local lock file over a parent lock file', () => {
    fs.writeFileSync(path.join(tempDir, 'pnpm-lock.yaml'), '');
    const nestedDir = path.join(tempDir, 'packages', 'app');
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(path.join(nestedDir, 'package-lock.json'), '');

    const detector = new PackageManagerDetector(new MockConfigurationService());
    const result = detector.detect(nestedDir, tempDir);

    assert.strictEqual(result, PackageManager.NPM);
  });

  test('Should detect bun from bun.lock', () => {
    fs.writeFileSync(path.join(tempDir, 'bun.lock'), '');
    const detector = new PackageManagerDetector(new MockConfigurationService());
    const result = detector.detect(tempDir);

    assert.strictEqual(result, PackageManager.BUN);
  });
});
