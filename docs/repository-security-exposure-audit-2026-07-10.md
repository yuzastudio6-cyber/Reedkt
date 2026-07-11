# Repository Security Exposure Audit — 2026-07-10

Status: current working tree scanned; GitHub and live Supabase still require operator verification

## Confirmed facts

- The configured GitHub remote is `yuzastudio6-cyber/Reedkt`.
- GitHub reports the repository as **public** and its default branch as
  `codex/reeditpro-web-ui-shell`.
- The public default-branch copy of
  `202605190002_storytiming_master_tables.sql` does enable RLS for
  `master_timing_maps` through dynamic SQL. The email's exact claim that the
  migration creates the table without enabling RLS is therefore a source-level
  false positive.
- That public source still grants authenticated insert/update access to the
  StoryTiming tables and does not prove `FORCE ROW LEVEL SECURITY`, secure-view
  behavior, or the policy state installed in a live database. The local
  hardening branch is stricter, but it has not been applied remotely.
- A non-mutating working-tree scan checked the current source tree and found no
  committed secret pattern after known test placeholders were excluded.
- A value-redacting reachable-blob scan found no configured secret pattern in
  either the current branch history (`HEAD`, 2,176 unique reachable blobs) or
  the public default branch history (`origin/codex/reeditpro-web-ui-shell`,
  4,006 unique reachable blobs). Blob values are never printed.
- `.env`, private-key, PKCS, and service-account credential filenames are now
  ignored by default while scrubbed `*.example` environment files remain
  allowed.
- CI now runs both `npm run check:secrets` and the checked branch's reachable
  history scan. Findings report only object/file/category metadata; suspected
  values are never printed.

## What the email does and does not mean

The sender could inspect this migration because the repository is public. That
does not prove the sender accessed Supabase, exploited a policy, or possesses a
credential. Do not provide repository access, infrastructure details, database
output, or secrets in a reply. Do not paste the suggested `auth.uid() = user_id`
policy: the table has no `user_id` and ReeditPro uses workspace/project tenancy.

## Unverified security state

This audit does not establish:

- whether a Supabase project is currently deployed from this migration;
- whether live `pg_class`, `pg_policy`, grants, functions, or storage policies
  match any branch;
- whether GitHub secret scanning, push protection, Dependabot, code scanning,
  rulesets, required reviews, or signed commits are enabled;
- whether an old commit ever contained a credential;
- whether a credential exposed outside the repository remains valid.

The local Git object store has thousands of Codex checkpoint/branch refs and
macOS AppleDouble `._pack-*.idx` artifacts. A scan of every local ref is not a
practical CI boundary and includes non-pushable checkpoint objects. The
checked branch and public default branch histories were scanned successfully;
other public GitHub branches still require GitHub-side secret scanning.

## Required operator actions

1. If this source is proprietary, make the GitHub repository private. This is
   an external administrative change and requires repository-owner approval.
2. Enable GitHub secret scanning and push protection, Dependabot alerts and
   security updates, code scanning, and a protected default-branch ruleset.
3. Require pull requests, passing CI, review, and blocked force-push/deletion
   for the release branch.
4. Run a GitHub-side full-history secret scan. Rotate/revoke any real credential
   ever reported, even if a later commit removed it.
5. Change the default branch only after the secured branch is reviewed and the
   current dirty worktree is safely reconciled.
6. Verify live Supabase catalog state and Security Advisor separately. Source
   hardening is not remote remediation.

## Local enforcement

```bash
npm run check:secrets
npm run check:secrets:history
npm run audit:supabase-security
npm run smoke:supabase-security
```

The Supabase audit intentionally remains blocked by the parallel migration
baseline, identity-contract drift, and missing canonical composite tenant
bindings. An isolated canonical-v2 chain is being built before any database
operation is authorized.
