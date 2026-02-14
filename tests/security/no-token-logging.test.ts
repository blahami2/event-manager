/**
 * T-033: Token Logging Audit
 *
 * Security tests that scan production source code for forbidden patterns
 * defined in docs/ARCHITECTURE_RULES.md (F1, F2, F3).
 *
 * These are static-analysis grep-based tests — no runtime detection.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '../../src');

/** Recursively collect all .ts/.tsx files under a directory, excluding test files */
function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir.toString(), entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      results.push(...collectSourceFiles(full));
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.tsx')
    ) {
      results.push(full);
    }
  }
  return results;
}

interface Violation {
  file: string;
  line: number;
  content: string;
  rule: string;
}

function scanFiles(
  files: string[],
  pattern: RegExp,
  rule: string,
  /** Optional filter: only check files whose relative path matches */
  pathFilter?: RegExp
): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const rel = path.relative(SRC_DIR, file);
    if (pathFilter && !pathFilter.test(rel)) continue;
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      // Skip comments
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
      if (pattern.test(line)) {
        violations.push({ file: rel, line: i + 1, content: trimmed, rule });
      }
    }
  }
  return violations;
}

function formatViolations(violations: Violation[]): string {
  return violations
    .map((v) => `  ${v.rule} | ${v.file}:${v.line} → ${v.content}`)
    .join('\n');
}

describe('Token Logging Audit (F1-F3)', () => {
  const files = collectSourceFiles(SRC_DIR);

  it('F1: no logging of raw token variables', () => {
    // Matches console.log/warn/error/info/debug calls that reference "token" as argument
    const pattern = /console\.(log|warn|error|info|debug)\s*\([^)]*\btoken\b/i;
    const violations = scanFiles(files, pattern, 'F1');
    expect(violations, `F1 violations found:\n${formatViolations(violations)}`).toHaveLength(0);
  });

  it('F2: no req.url logging on manage routes', () => {
    // Matches console.log calls referencing req.url or request.url
    const pattern = /console\.(log|warn|error|info|debug)\s*\([^)]*\breq(uest)?\.(url|URL)\b/;
    // Only check route handlers and middleware that could handle manage routes
    const violations = scanFiles(files, pattern, 'F2');
    expect(violations, `F2 violations found:\n${formatViolations(violations)}`).toHaveLength(0);
  });

  it('F3: no logging of process.env secrets', () => {
    const pattern = /console\.(log|warn|error|info|debug)\s*\([^)]*process\.env\b/;
    const violations = scanFiles(files, pattern, 'F3');
    expect(violations, `F3 violations found:\n${formatViolations(violations)}`).toHaveLength(0);
  });

  it('no console.log calls in production source code', () => {
    // Production code should use structured logger, not console.log
    // Allow console.error/warn in limited cases but console.log should not exist
    const pattern = /console\.log\s*\(/;
    const violations = scanFiles(files, pattern, 'no-console-log');

    // Filter out any that are in test utilities or explicitly commented as allowed
    expect(
      violations,
      `Unexpected console.log in production code:\n${formatViolations(violations)}`
    ).toHaveLength(0);
  });

  it('no raw token values in string interpolation logs', () => {
    // Catches template literals that interpolate token: `...${token}...` in log calls
    const pattern = /console\.(log|warn|error|info|debug)\s*\(`[^`]*\$\{[^}]*token[^}]*\}/i;
    const violations = scanFiles(files, pattern, 'F1-interpolation');
    expect(violations, `Token interpolation in logs:\n${formatViolations(violations)}`).toHaveLength(
      0
    );
  });

  it('source directory exists and has files to scan', () => {
    expect(files.length).toBeGreaterThan(0);
  });
});
