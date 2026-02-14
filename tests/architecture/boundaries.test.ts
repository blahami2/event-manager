import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

function hasImport(dir: string, importPattern: string): boolean {
  try {
    const result = execSync(
      `rg "${importPattern}" ${dir} --type ts -l || true`,
      { encoding: 'utf-8' }
    );
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

describe('Architecture Boundaries', () => {
  it('L1: UI layer does not import from repositories', () => {
    expect(hasImport('src/app', 'from.*repositories')).toBe(false);
    expect(hasImport('src/components', 'from.*repositories')).toBe(false);
  });

  it('L4: Use cases do not import from components', () => {
    expect(hasImport('src/lib/usecases', 'from.*components')).toBe(false);
  });

  it('L5: Repositories do not import from use cases', () => {
    expect(hasImport('src/repositories', 'from.*usecases')).toBe(false);
  });

  it('L6: Only repositories import PrismaClient', () => {
    const result = execSync(
      `rg "from.*@prisma/client" src --type ts -l --glob '!src/repositories/**' || true`,
      { encoding: 'utf-8' }
    );
    expect(result.trim()).toBe('');
  });
});
