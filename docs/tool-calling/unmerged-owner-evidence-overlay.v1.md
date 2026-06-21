# Unmerged Owner Evidence Overlay v1

## Purpose

The unmerged owner evidence overlay makes open and draft PRs visible to future Reeditpro tool-calling milestones. Owner lanes can contain useful install proof, runtime proof, blocker fixes, Docker requirements, capability cards, adapter work, QA review, and duplicate-risk signals before those changes are merged.

Open PRs are candidate evidence only. They are not final source of truth, must not directly unlock runtime selection, and must not replace `server/tool-registry`, QA policy, fallback policy, worker routing, adapter planning, fixture/probe layers, or Supabase/runtime table design.

## Source-Of-Truth Rules

- Merged PRs can become source evidence only when the current base includes them or a branch/report explicitly references the merged evidence.
- Open PRs are `open_pr_candidate_evidence` and require reconciliation after merge.
- Draft PRs are candidate evidence only and should generally wait for owner readiness before runtime or install conclusions.
- Closed/rejected PRs are not source of truth unless a later merged source explicitly revives that evidence.
- Owner labels, lanes, and PR titles are evidence metadata only; they must not become runtime ranking dimensions.

## Duplicate Prevention Rules

Future tool-calling milestones must check this overlay before implementation. If an open owner PR already covers the same tool, capability, install proof, Docker requirement, runtime proof, adapter, QA review, or blocker resolution, the milestone must mark duplicate risk and either wait for merge or reconcile after merge.

Docs/review-only PRs can be cited as candidate evidence while planning overlays continue, but implementation surfaces such as `server/tool-registry`, worker routes, adapter execution, safe command execution, fixture/probe layers, Supabase tables, SQL, migrations, and package-lock changes must not be duplicated.

## GitHub Availability

When GitHub CLI access is available, diagnostics scan open and recent merged PRs and inspect PR files. When GitHub access is unavailable, diagnostics continue in local-only mode with `githubPrScanAvailable: false` and no candidate PR evidence is promoted.

## Future Milestone Requirement

Every future tool-calling milestone must run:

- `npm run tool-calling:refresh-gate`
- `npm run tool-calling:unmerged-owner-evidence`

The second command is the authoritative unmerged-owner classifier. The refresh gate remains the broader branch/package/duplicate preflight.
