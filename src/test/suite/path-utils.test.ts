import * as assert from 'assert';
import * as path from 'path';
import {
  buildExcludeGlob,
  isPathExcluded,
  isWithinRoot,
  toPosixRelativePath,
} from '../../utils/path-utils';
import { DEFAULT_EXCLUDE_PATTERNS } from '../../services/configuration-service';

suite('Path Utils Tests', () => {
  test('Should build a brace glob from multiple exclude patterns', () => {
    const glob = buildExcludeGlob(['**/node_modules/**', '**/.git/**']);
    assert.strictEqual(glob, '{**/node_modules/**,**/.git/**}');
  });

  test('Should exclude node_modules paths', () => {
    assert.strictEqual(isPathExcluded('node_modules/foo', DEFAULT_EXCLUDE_PATTERNS), true);
    assert.strictEqual(isPathExcluded('microfrontend/mf-sales', DEFAULT_EXCLUDE_PATTERNS), false);
  });

  test('Should convert nested paths to POSIX relative paths', () => {
    const root = path.join('workspace', 'mytheondev');
    const nested = path.join(root, 'microfrontend', 'mf-sales');
    assert.strictEqual(toPosixRelativePath(root, nested), 'microfrontend/mf-sales');
    assert.strictEqual(toPosixRelativePath(root, root), '.');
  });

  test('Should detect paths inside the workspace root', () => {
    const root = path.join('workspace', 'mytheondev');
    const nested = path.join(root, 'microfrontend', 'mf-sales');
    const outside = path.join('workspace', 'other');

    assert.strictEqual(isWithinRoot(root, nested), true);
    assert.strictEqual(isWithinRoot(root, root), true);
    assert.strictEqual(isWithinRoot(root, outside), false);
  });
});
