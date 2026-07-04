# Project Edit Brief Owner Evidence PR Diff Validation

## Decision

`project_edit_brief_owner_evidence_pr_diff_validation_passed_ready_for_reviewed_evidence_pr`

## Scope

RP-EDITBRIEF-15E adds a PR/diff validator for the future owner-evidence update. It is a source-control hygiene gate only. It does not approve owner evidence, does not edit evidence, does not write Supabase, and does not enable external beta, real-user-media beta, paid production, uploads, providers/models, workers, render/export, or credits.

## Commands

Default staged-diff check, safe for this metadata PR:

```bash
npm run check:project-edit-brief-owner-evidence-pr-diff
```

Strict future evidence PR check:

```bash
npx tsx scripts/validation/project-edit-brief-owner-evidence-pr-diff.ts --staged --require-intake-change
```

The strict check requires:

- the staged diff changes `docs/project-edit-brief-owner-evidence-intake-template.json`,
- no other files are staged,
- the owner evidence readiness evaluator passes,
- the evidence safety scan passes.

## Why This Exists

The owner evidence gate should be updated by a narrow reviewed PR. That PR should not accidentally include private media, runtime source, Supabase migrations, lockfile churn, generated artifacts, signed URLs, raw prompts, or unrelated docs. The diff validator makes that rule executable.

## Current State

The current source-truth reconciliation PR does not include real owner evidence. The default command can pass with no staged diff. The strict mode is for the later owner-evidence PR, after owners provide real evidence outside source control and the intake file is updated deliberately.
