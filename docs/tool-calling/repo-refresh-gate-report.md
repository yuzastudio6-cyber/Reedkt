# Tool-Calling Repo Refresh Gate Report

## Branch And Stack

- Branch: `codex/reeditpro-tool-calling-refresh-gate-1`
- Stacked base: `codex/reeditpro-tool-calling-brain-2-capability-cards`
- Parent PR: #584
- Purpose: add a mandatory refresh/no-duplicate gate before future tool-calling milestones.

## Changed Tool-Calling Paths

- `docs/tool-calling/repo-refresh-gate-policy.v1.md`
- `docs/tool-calling/repo-refresh-gate-report.md`
- `docs/tool-calling/repo-integration-audit.md`
- `docs/tool-calling/tool-calling-brain.v1.md`
- `scripts/validation/tool-calling-refresh-gate.mjs`
- `scripts/validation/tool-calling-brain-diagnostics.mjs`
- `package.json` script entry only

## Duplicate Findings

- Duplicate production registry: not created.
- Duplicate worker router: not created.
- Duplicate QA policy: not created.
- Duplicate fallback policy: not created.
- Duplicate runtime/Supabase table system: not created.
- Duplicate study-card IDs: none found.
- Duplicate alias conflicts: none found.

## Pending External Tool Findings

- Pending external tools from Milestone 2 remain report-only until first-class registry promotion.
- The gate blocks if a pending external tool becomes a first-class `ProductionToolId` while still marked pending.
- Current pending external tools: `exiftool`, `imagemagick`, `mediainfo`, `tesseract`.
- Pending external tools now first-class: none found.

## Decision

- Refresh-gate decision for this branch: continue allowed.
- Fetch was skipped by default; rerun with `REEDITPRO_REFRESH_GATE_ALLOW_FETCH=1` when network refresh is safe.
- GitHub PR scan was available and reported open/relevant PR context without blocking this branch.
- `package-lock.json` is dirty in the worktree but is not staged and must remain outside this milestone.

## Validation Commands

- `npm run tool-calling:refresh-gate`
- `npm run tool-calling:diagnostics`
- `npm run smoke:prod-tool-registry`
- `npm run lint`
- `git diff --check`
- `git diff --cached --check`
- `npm run typecheck:server`
