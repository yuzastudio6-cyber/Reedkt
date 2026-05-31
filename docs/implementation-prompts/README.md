# Implementation Prompts

This directory records production-foundation prompts as repo artifacts. Each implementation prompt should identify the milestone, branch, PR, status, validation, and exactly what production capability was or was not enabled.

Future prompt records should be updated when a PR is opened, revised, blocked, or merged.

| Prompt | Milestone | Branch | PR | Status | Production capability enabled? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 00 | Source-of-truth repo consolidation | `codex/rp-foundation-00-source-of-truth` | [PR #69](https://github.com/yuzastudio6-cyber/Reedkt/pull/69) | PR open | No | Docs-only consolidation. No backend execution, provider calls, rendering, Stripe, migrations, deployment, package installs, or tool execution. |
| 01 | Production Architecture Freeze | `codex/rp-foundation-01-production-architecture-freeze` | [PR #70](https://github.com/yuzastudio6-cyber/Reedkt/pull/70) | PR open | No | Docs-only architecture boundary freeze. No backend execution, provider calls, rendering, Stripe, migrations, deployment, workers, service-role handlers, or tool execution. |
| 02 | Supabase Schema Review and Migration Validation | `codex/rp-foundation-02-supabase-schema-review-validation` | [PR #71](https://github.com/yuzastudio6-cyber/Reedkt/pull/71) | PR open | No | Schema review plus validation docs/static audit only. No production migration, remote Supabase migration, backend service-role handler, provider call, rendering, Stripe, worker execution, or tool execution. |
| 02A | Schema Gap Fix Plan | `codex/rp-foundation-02a-schema-gap-fix-plan` | Pending PR | Open / pending validation | No | Docs-only canonical schema decision and Prompt 3 guardrails. No SQL execution, schema-changing migration, backend service-role handler, provider call, rendering, Stripe, worker execution, or tool execution. |
