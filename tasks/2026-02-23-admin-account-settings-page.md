# Admin Account Settings Page

**Created:** 2026-02-23  
**Status:** QUEUED (starts after manage title centering fix completes)  
**Goal:** Add account settings tab to admin UI for password change functionality

## Requirements

1. **New admin route:** `/admin/settings`
2. **Add to admin navigation:** New "Settings" / "Account Settings" tab in AdminNav
3. **Settings page content:**
   - Page title: "Account Settings" or similar
   - Change password form:
     - Current password field
     - New password field
     - Confirm new password field
     - Submit button
   - Success/error messages
4. **Backend API:** Supabase Auth password change
5. **Styling:** Match dark/crimson admin aesthetic from PR #83
6. **Validation:** 
   - Current password required
   - New password strength requirements (min 8 chars, etc.)
   - New password must match confirmation
7. **Tests:** Add test coverage for new route/component

## Acceptance Criteria

- [ ] Settings tab appears in admin nav
- [ ] Settings page accessible at `/admin/settings`
- [ ] Change password form functional with Supabase Auth
- [ ] Form validation works
- [ ] Success/error states properly displayed
- [ ] Styling matches existing admin dark/crimson aesthetic
- [ ] All admin tests passing
- [ ] PR created and CI passing

## Implementation Notes

- Use Supabase `supabase.auth.updateUser({ password: newPassword })` for password change
- Verify current password before allowing change (security best practice)
- Consider adding email change functionality in future iteration (out of scope for now)

## Dev Loop

Run full design → implement → review → iterate loop:
1. Design pass: Define UI/UX, component structure, acceptance gates
2. Implementation: Create route, component, API integration, tests
3. Review: Score against gates
4. Iterate until ≥90/100
