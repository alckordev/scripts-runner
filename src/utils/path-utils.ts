import * as path from 'path';

/**
 * Builds a VS Code glob for `findFiles` exclude from a list of patterns.
 */
export function buildExcludeGlob(patterns: string[]): string {
  if (patterns.length === 0) {
    return '';
  }

  if (patterns.length === 1) {
    return patterns[0];
  }

  return `{${patterns.join(',')}}`;
}

/**
 * Returns a POSIX-style path relative to the workspace root.
 * The workspace root itself is represented as `.`.
 */
export function toPosixRelativePath(workspaceRoot: string, targetPath: string): string {
  const relative = path.relative(workspaceRoot, targetPath);

  if (relative === '') {
    return '.';
  }

  return relative.split(path.sep).join('/');
}

/**
 * Returns true when `candidate` is the same as `root` or a descendant of it.
 */
export function isWithinRoot(root: string, candidate: string): boolean {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  const relative = path.relative(resolvedRoot, resolvedCandidate);

  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * Returns true when a POSIX relative path matches any exclude glob.
 * Supports the common exclude patterns used by this extension, such as node_modules.
 */
export function isPathExcluded(relativePosix: string, excludePatterns: string[]): boolean {
  const normalized = relativePosix.replace(/\\/g, '/');
  const segments = normalized.split('/').filter((segment) => segment.length > 0);

  return excludePatterns.some((pattern) => {
    const tokens = pattern.split('/').filter((token) => token && token !== '**' && token !== '*');
    return tokens.some((token) => segments.includes(token));
  });
}
