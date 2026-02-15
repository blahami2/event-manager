# Bug Backlog

> **Purpose**: Track and fix production bugs found in event-manager.
> Each bug gets a B-XXX identifier and is fixed via the bug-fixing loop.

---

## Status Legend
- ⏳ **TODO**: Not started
- 🔍 **INVESTIGATING**: Analyzing root cause
- 🔧 **IN PROGRESS**: Fix being implemented
- ✅ **FIXED**: PR merged to main
- ❌ **WONTFIX**: Not fixing (with reason)

---

## B-001: Admin Login Endpoint Returns HTTP 500

**Status**: ✅ FIXED (PR #65 ready to merge - all checks passed)  
**Severity**: CRITICAL  
**Environment**: Production (Vercel)  
**URL**: `https://event-manager-sandy.vercel.app/admin/login`

**Symptoms**:
- GET request returns HTTP 500
- Browser console shows SES lockdown errors
- NextJS error in stack trace

**Error Log**:
```
GET https://event-manager-sandy.vercel.app/admin/login [HTTP/2 500 10ms]
SES Removing unpermitted intrinsics lockdown-install.js:1:203117
Removing intrinsics.%MapPrototype%.getOrInsert lockdown-install.js:1:202962
...
SES_UNCAUGHT_EXCEPTION: Error: NextJS 41
```

**Notes**:
- SES errors may be from MetaMask extension (moz-extension URL in stack)
- Actual server error is HTTP 500, need to check server logs

**Related PRs**: #65

---

## B-002: Manage Link Shows "Something went wrong" Error

**Status**: ✅ FIXED (PR #67 MERGEABLE - all checks passed)  
**Severity**: HIGH  
**Environment**: Production (Vercel - after PR #65 merge)  
**URL**: `https://event-manager-sandy.vercel.app/manage/*`

**Symptoms**:
- Page loads but shows error message: "Something went wrong. An unexpected error occurred. Please try again."
- Prisma query fails with prepared statement error

**Error Log**:
```
Error [PrismaClientUnknownRequestError]: Invalid prisma.registrationToken.findFirst() invocation:
Error occurred during query execution:
ConnectorError(ConnectorError { 
  user_facing_error: None, 
  kind: QueryError(PostgresError { 
    code: "42P05", 
    message: "prepared statement \"s0\" already exists", 
    severity: "ERROR" 
  })
})
```

**Root Cause**: Prisma connection pooling issue in serverless (Vercel). PostgreSQL error "prepared statement already exists" indicates connection pool exhaustion or mismanagement.

**Fix**: Added `prisma.config.ts` with connection pool configuration for serverless:
- `connection_limit=1` (one connection per serverless instance)
- `pool_timeout=10` (prevent connection exhaustion)
- Singleton pattern already in use

**Related PRs**: #67 (Prisma connection pooling), #65 (NextIntlClientProvider fix)

---

## Workflow

For each bug:
1. **Investigate** - Reproduce, analyze logs, identify root cause
2. **Design** - Plan minimal fix with tests
3. **Implement** - Create branch `bugfix/B-XXX-description`
4. **Test** - Verify fix locally + CI
5. **PR** - Submit with title `B-XXX: description`
6. **Deploy** - Merge + verify in production

---

## B-003: Admin Login Does Nothing on Submit

**Status**: 🔧 IN PROGRESS (bug-fixer: f89a992f-4bc3-4f9d-85e5-b548882c0b2e, spawned 21:41 UTC)  
**Severity**: CRITICAL  
**Environment**: Production (Vercel - after PR #65 merge)  
**URL**: `https://event-manager-sandy.vercel.app/admin/login`

**Symptoms**:
- Login page loads successfully (no 500 error)
- Enter credentials and click submit
- Form submission does nothing (no error, no redirect)
- Multiple GoTrueClient instances warning in console

**Error Log**:
```
Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.

SES_UNCAUGHT_EXCEPTION: Error: Minified React error #418 (hydration mismatch)
```

**Root Cause**: Supabase browser client is being created multiple times instead of using a singleton pattern. This causes:
- Multiple GoTrueClient instances competing for the same localStorage key
- Undefined behavior in auth state (one instance handles login, another reads state)
- Auth state split across instances, making login appear to do nothing

**Fix**: Implement proper singleton pattern for `createBrowserClient()`, similar to the server-side Prisma singleton pattern. Ensure only one Supabase client instance exists per browser context.

**Related PRs**: #65 (fixed NextIntlClientProvider issue)

**Investigation**: `reviews/B-002-B-003-investigation.md` (initial env vars hypothesis - revised after error logs)

**History**:
- Initial hypothesis: missing env vars (from investigation without logs)
- Revised root cause (2026-02-15 21:41 UTC): Multiple client instances after seeing browser console errors
- Bug fixer spawned with monitoring cron (dc815514)

---

---

## B-004: Register API i18n Formatting Error

**Status**: 🔧 IN PROGRESS (bug-fixer retry: 274028d0-7cea-4b31-82bc-84d266336bbd, monitoring cron: fe3f7bae)  
**Severity**: HIGH  
**Environment**: Production (Vercel)  
**URL**: `/api/register`

**Symptoms**:
- Registration form submission fails
- Email template rendering error

**Error Log**:
```
Error: FORMATTING_ERROR: The intl string context variable "strong" was not provided to the string 
"Thank you for registering for <strong>{eventName}</strong> on <strong>{eventDate}</strong>."
```

**Root Cause**: Email template uses `<strong>` HTML tags in i18n message, but next-intl requires rich text formatting to be provided as components via the `values` prop, not inline HTML.

**Fix**: Either:
1. Remove `<strong>` tags from translation strings and use plain text
2. Or provide rich text components via `t.rich()` with proper component mapping

**Related PRs**: -

**History**:
- First attempt (d0721c5a) failed/timed out without creating PR
- Retry spawned at 21:29 UTC (274028d0) with monitoring cron

---
