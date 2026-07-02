# RP-BETA-INTEGRATION-25 Checklist

- [x] Owner implementation request treated as approval for local Qwen clone package-split staging and commits only.
- [x] Confirmed Qwen clone had `0` pre-existing staged files before staging.
- [x] Ran Qwen pre-stage validation before any staging.
- [x] Used explicit `/tmp` manifests for file staging.
- [x] Used index-only patch staging for `package.json`.
- [x] Limited staged package scripts to the eight approved Qwen/Project Edit Brief/frontend-boundary/Supabase-safety commands.
- [x] Limited staged package dependencies to `@google-cloud/secret-manager` and `@playwright/test`.
- [x] Staged `package-lock.json` by explicit path after root dependency delta check.
- [x] Created six local Qwen commits in the approved order.
- [x] Verified Qwen index was empty after commits.
- [x] Ran Qwen post-commit validation.
- [x] Updated only RP-SKILLS Markdown documentation.
- [x] Did not copy Qwen files into RP-SKILLS.

## Fail Cases Avoided

- [x] No broad `git add`.
- [x] No package scripts outside the approved allowlist were staged.
- [x] No package installs were run.
- [x] No Qwen push, merge, rebase, tag, or deploy occurred.
- [x] No provider call, worker execution, app runtime, or remote Supabase command occurred.
- [x] No RP-SKILLS package, migration, manifest, type, mock, runtime, UI, provider, or worker file changed.
- [x] No staged files remain in either repo.

## Next

Recommended next prompt:

`RP-BETA-INTEGRATION-26 - Qwen Beta Commit Import into RP-SKILLS Repo`

