# Creative Graphics Next Fixture Plan

Status: `static_gate_passed_with_warnings`

## GD-2 - Creative Graphics All-Tools Dry-Run Fixture Pack

- Goal: create synthetic dry-run fixture definitions for all 12 tools.
- Allowed scope: docs, fixture schemas, static diagnostics.
- Blocked scope: tool execution, worker execution, render/export, providers, Supabase, SQL, cloud, public artifacts.
- Tools covered: all 12 GD tools.
- Evidence created: fixture input shape, expected private artifact type, QA checks, blocked uses.

## GD-3 - Creative Graphics Generated/Local Fixture Candidate Pack

- Goal: prepare generated/local candidate plans for all 12 tools.
- Allowed scope: static candidate manifests, private artifact placeholders, QA evidence templates, and handoff candidates.
- Blocked scope: actual generated artifacts, uploads, signed URLs, public artifacts, runtime execution, Track A final render/export.
- Tools covered: all 12 GD tools.
- Evidence created: local artifact placeholders, private artifact placeholders, QA evidence templates, Track A handoff candidates, worker envelope candidates.

## GD-4 - Creative Graphics Static Fixture Gate Review

- Goal: statically validate GD-1 manifests, GD-2 dry-run fixtures, and GD-3 generated/local candidates across all 12 tools.
- Allowed scope: docs, static diagnostics, per-tool gate matrix, consistency review, handoff review, worker envelope review, QA readiness review, blocker inventory.
- Blocked scope: runtime execution, worker execution, browser capture, render/export, media processing, storage transfer, Supabase mutation, SQL, public artifacts, signed URLs.
- Tools covered: all 12 GD tools.
- Evidence created: static gate result, per-tool warning rows, consistency review, blocker inventory, and next execution-plan readiness decision.

## GD-5 - Controlled Generated Fixture Execution Plan

- Goal: plan first controlled generated/local fixture execution without executing it.
- Allowed scope: execution plan, evidence collection plan, private artifact policy, Track A handoff plan, worker envelope plan, rollback plan.
- Blocked scope: actual fixture execution, generated artifacts, uploads, signed URLs, public artifacts, final render/export, worker runtime.
- Tools covered: all 12 GD tools unless GD-5 chooses a smaller pilot set.
- Evidence required: explicit execution gates, synthetic inputs, private artifact destinations, QA evidence requirements, cost/audit controls, and owner handoff approvals.

Recommended next prompt: `Prompt GD-5 - Controlled Generated Fixture Execution Plan`.
