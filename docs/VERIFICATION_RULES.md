# Verification Rules (Layer C)

> **Purpose**: Automated verification rules that run in CI.
> Agents receive pass/fail feedback from these checks.
> All rules must pass before any PR is merged.

---

# 1. TypeScript Configuration

## Required `tsconfig.json` settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": false,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
```

**Verification:** `npx tsc --noEmit` exits with code 0.

---

# 2. ESLint Configuration

## Required rules:

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": ["warn", {
      "allowExpressions": true,
      "allowTypedFunctionExpressions": true
    }],
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "no-restricted-imports": ["error", {
      "patterns": [
        {
          "group": ["@prisma/client"],
          "importNames": ["PrismaClient"],
          "message": "Import PrismaClient only in src/repositories/. Use repository methods elsewhere."
        }
      ]
    }]
  },
  "overrides": [
    {
      "files": ["src/repositories/**/*.ts"],
      "rules": {
        "no-restricted-imports": "off"
      }
    },
    {
      "files": ["src/lib/logger.ts"],
      "rules": {
        "no-console": "off"
      }
    }
  ]
}
```

**Verification:** `npm run lint` exits with code 0.

---

# 3. Prisma Schema Validation

**Verification commands (all must pass):**

```bash
npx prisma validate
npx prisma generate
```

**Schema requirements checked:**

- [ ] `Registration` model exists with all required fields
- [ ] `RegistrationToken` model exists with `tokenHash` (unique, indexed)
- [ ] `AdminUser` model exists with `supabaseUserId` (unique)
- [ ] All relations have proper foreign keys
- [ ] No `@@map` renaming that breaks conventions

---

# 4. Unit Test Coverage

## Minimum coverage thresholds:

| Metric     | Minimum |
|------------|---------|
| Lines      | 80%     |
| Functions  | 80%     |
| Branches   | 75%     |
| Statements | 80%     |

## Vitest configuration:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      include: ['src/lib/**', 'src/repositories/**'],
      exclude: ['src/lib/auth/supabase-client.ts', 'src/config/**'],
    },
  },
});
```

**Verification:** `npx vitest run --coverage` exits with code 0 and meets thresholds.

---

# 5. Forbidden Pattern Checks

Automated checks that scan the codebase for forbidden patterns. These run as a test suite.

> **Note:** These tests use `rg` (ripgrep) for pattern scanning. The CI pipeline installs
> ripgrep explicitly (`sudo apt-get install -y ripgrep`). For local development, ensure
> ripgrep is installed: `brew install ripgrep` (macOS) or `sudo apt install ripgrep` (Ubuntu).

## Test file: `tests/security/forbidden-patterns.test.ts`

```typescript
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
    // Must not log variables named "token" or "rawToken"
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
    // Exclude files with justified "any" usage (marked with // eslint-disable-next-line)
    const count = grepCount(': any[^_]', SRC_DIR);
    expect(count).toBe(0);
  });

  it('F8: No empty catch blocks', () => {
    const count = grepCount('catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}', SRC_DIR);
    expect(count).toBe(0);
  });

  it('F9: No hardcoded secrets', () => {
    const patterns = [
      'sk_live_',      // Stripe-like keys
      'key-',          // Resend keys
      'sbp_',          // Supabase keys
      'password\\s*=\\s*["\'](?!\\$)',  // Hardcoded passwords
    ];
    for (const pattern of patterns) {
      const count = grepCount(pattern, SRC_DIR);
      expect(count).toBe(0);
    }
  });
});
```

**Verification:** `npx vitest run tests/security/` exits with code 0.

---

# 6. Architecture Boundary Checks

Automated checks that verify layer boundaries.

## Test file: `tests/architecture/boundaries.test.ts`

```typescript
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
    // Check non-repository source files
    const result = execSync(
      `rg "from.*@prisma/client" src --type ts -l --glob '!src/repositories/**' || true`,
      { encoding: 'utf-8' }
    );
    expect(result.trim()).toBe('');
  });
});
```

**Verification:** `npx vitest run tests/architecture/` exits with code 0.

---

# 7. Build Verification

**Commands that must pass:**

```bash
npm run build          # Next.js production build succeeds
npx tsc --noEmit       # Type checking passes
npm run lint           # ESLint passes
npx prisma validate    # Schema valid
npx vitest run         # All tests pass
```

---

# 8. CI Pipeline Definition

## GitHub Actions workflow: `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install ripgrep
        run: sudo apt-get install -y ripgrep

      - name: Prisma generate
        run: npx prisma generate

      - name: Type check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Unit tests with coverage
        run: npx vitest run --coverage

      - name: Security checks
        run: npx vitest run tests/security/

      - name: Architecture checks
        run: npx vitest run tests/architecture/

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: "postgresql://placeholder:placeholder@localhost:5432/placeholder"
          DIRECT_URL: "postgresql://placeholder:placeholder@localhost:5432/placeholder"
          NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co"
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder"
          SUPABASE_SERVICE_ROLE_KEY: "placeholder"
          RESEND_API_KEY: "placeholder"
          BASE_URL: "http://localhost:3000"
```

---

# 9. Done = Deployable

A ticket is only "done" when ALL of the following are true:

## 9.1 CI Passes

- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] `npx prisma validate` passes
- [ ] `npx vitest run` passes (all tests, including security and architecture checks)
- [ ] Coverage thresholds met

## 9.2 Deployment Ready

- [ ] App deploys to Vercel preview (PR preview deployment)
- [ ] No new environment variables needed without updating `.env.example`
- [ ] If new env vars added: documented in `docs/ARCHITECTURE.md` Section 10.3

## 9.3 Documentation

- [ ] Any new API endpoints documented in `docs/ARCHITECTURE.md` Section 12
- [ ] Any new environment variables documented
- [ ] README updated if user-facing behavior changed

## 9.4 Manual Verification Checklist

For each feature ticket, the following manual checks apply:

| Feature Area        | Manual Check                                               |
|---------------------|------------------------------------------------------------|
| Registration        | Submit form → receive email → link works                   |
| Manage page         | Edit fields → save → data persisted                        |
| Cancel              | Cancel → confirmation shown → registration marked cancelled|
| Resend link         | Submit email → same message shown (exists or not)          |
| Admin login         | Login → dashboard loads → stats correct                    |
| Admin list          | Filter, paginate, search → correct results                 |
| Admin actions       | Cancel registration → status updated → logged              |
| CSV export          | Download → file opens in Excel → data correct              |
| Rate limiting       | Exceed limit → 429 shown → resets after window             |
| Error states        | Invalid input → field errors shown → no crash              |

---

# 10. Pre-Merge Checklist (for Agents)

Before marking any ticket as complete, verify:

```
□ All acceptance criteria from the ticket are met
□ npx tsc --noEmit passes
□ npm run lint passes
□ npx vitest run passes
□ No new linter warnings introduced
□ No console.log statements added (use logger)
□ No raw tokens logged anywhere
□ No business logic in UI components
□ No direct Prisma imports outside repositories
□ .env.example updated if new env vars added
□ Error responses follow the standard format
```

---

End of Verification Rules.
