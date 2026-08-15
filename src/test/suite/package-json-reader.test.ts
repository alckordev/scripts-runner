import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PackageJsonReader } from '../../services/package-json-reader';

suite('PackageJsonReader Tests', () => {
  let tempDir: string;

  setup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qsr-reader-'));
  });

  teardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('Should create instance correctly', () => {
    const reader = new PackageJsonReader();
    assert.ok(reader);
  });

  test('Should return false for non-existent path', () => {
    const reader = new PackageJsonReader();
    const exists = reader.exists('/fake/path/that/does/not/exist');
    assert.strictEqual(exists, false);
  });

  test('Should attach packageDir and relativePath to scripts', async () => {
    const reader = new PackageJsonReader();
    const packageJsonPath = path.join(tempDir, 'package.json');
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify({
        scripts: {
          dev: 'vite',
          build: 'vite build',
        },
      })
    );

    const scripts = await reader.readScripts(tempDir, 'microfrontend/mf-sales');

    assert.strictEqual(scripts.length, 2);
    assert.strictEqual(scripts[0].name, 'dev');
    assert.strictEqual(scripts[0].command, 'vite');
    assert.strictEqual(scripts[0].packageDir, tempDir);
    assert.strictEqual(scripts[0].relativePath, 'microfrontend/mf-sales');
    assert.strictEqual(scripts[1].packageDir, tempDir);
    assert.strictEqual(scripts[1].relativePath, 'microfrontend/mf-sales');
  });

  test('Should default relativePath to workspace root', async () => {
    const reader = new PackageJsonReader();
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ scripts: { start: 'node index.js' } })
    );

    const scripts = await reader.readScripts(tempDir);

    assert.strictEqual(scripts.length, 1);
    assert.strictEqual(scripts[0].relativePath, '.');
    assert.strictEqual(scripts[0].packageDir, tempDir);
  });
});
