# TOOL-ROUTE-EXECUTION-UNLOCK-2 Dry-Run Contract Prompt

## Summary

Implement the next metadata-only dry-run contract packet for tool-route execution after TOOL-ROUTE-EXECUTION-UNLOCK-1. This prompt may define deterministic fixture contracts and validation metadata, but it must not execute tools, routes, workers, providers, media, browser capture, maps, Supabase, SQL, storage, signed URLs, public artifacts, Docker, Cloud, credits, beta, production, or generated local fixture pass claims.

## Required Source Evidence

- TOOL-ROUTE-EXECUTION-UNLOCK-1 decision `tool_route_dry_run_plan_ready_with_warnings`
- 18 planned synthetic cases from `docs/activation-tool-route-execution-unlock-1-dry-run-plan-reports/tool_route_dry_run_case_matrix.json`
- completed pending-owner studies from PR #360
- tool-route repo audit from PR #369
- worker local fixture and fixture hardening metadata
- plan snapshot dry-run and contract metadata
- Track B route manifest metadata

## Contract Scope

Define future dry-run request/result contract fixtures for intent-to-capability routing, capability-to-tool mapping, route selection, scoring, blocked field rejection, owner handoffs, source-of-truth refs, artifact refs, idempotency/correlation, audit/cost, and billing placeholders.

## Runtime Policy

All execution remains blocked. The contract must use synthetic/private placeholder refs only and must reject raw prompts, raw provider output, direct tool/route invocation, executable worker payloads, provider secrets, service-role keys, signed URL source-of-truth, public artifact URLs, beta/production targets, real user data, private project payloads, and media payloads.

## Success Routing

On pass, recommend the next no-execution tool-route dry-run fixture or validation prompt. Do not recommend real tool or route execution.
