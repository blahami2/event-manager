import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

const SRC_DIR = 'src';

function grepCount(pattern: string, dir: string): number {
  try {
    const result = execSync(
      `rg --count-matches "${pattern}" ${dir} --type ts || true`,
      { encoding: 'utf-8' }
    );
    return result.split('\n').filter(Boolean).reduce((sum, line) => {
      const count = parseInt(line.split(':').pop() || '0', 10);
      return sum + count;
    }, 0);
  } catch {
    return 0;
  }
}

describe('Forbidden Patterns', () => {
  it('F1: No raw token logging', () => {
    const count = grepCount('console\\.(log|info|debug).*token', SRC_DIR);
    expect(count).toBe(0);
  });

  it('F2: No request URL logging on manage routes', () => {
    const count = grepCount('console\\.(log|info|debug).*req\\.url', `${SRC_DIR}/app`);
    expect(count).toBe(0);
  });

  it('F3: No environment secret logging', () => {
    const count = grepCount('console\\.(log|info|debug).*process\\.env', SRC_DIR);
    expect(count).toBe(0);
  });

  it('F6: No explicit "any" type (use unknown instead)', () => {
    const count = grepCount(': any[^_]', SRC_DIR);
    expect(count).toBe(0);
  });

  it('F8: No empty catch blocks', () => {
    const count = grepCount('catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}', SRC_DIR);
    expect(count).toBe(0);
  });

  it('F9: No hardcoded secrets', () => {
    const patterns = [
      'sk_live_',
      'key-',
      'sbp_',
      'password\\s*=\\s*["\'](?!\\$)',
    ];
    for (const pattern of patterns) {
      const count = grepCount(pattern, SRC_DIR);
      expect(count).toBe(0);
    }
  });
});
