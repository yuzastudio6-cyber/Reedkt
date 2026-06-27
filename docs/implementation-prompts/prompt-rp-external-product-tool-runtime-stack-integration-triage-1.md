# RP-EXTERNAL-PRODUCT-TOOL-RUNTIME-STACK-INTEGRATION-TRIAGE-1

## Summary

Implement a docs/status/diagnostics-only triage packet from the latest integration branch. Do not merge stacked QWEN2.5-VL, AI Graphics, tool-calling, or worker-runtime PRs automatically.

The purpose is to classify the open non-integration PR stacks, identify the correct owner/source chain, and recommend whether to repair, retire, merge in order, or create a fresh integration-based consolidation PR.

## Required Checks

- Verify current integration head.
- List open PRs for QWEN2.5-VL, AI Graphics, ReeditPro tool-calling, Track A tools, worker runtime, and beta platform lanes.
- Separate PRs based directly on integration from PRs based on old stacked branches.
- Identify draft, conflicting, dirty, stale, or non-integration bases.
- Preserve current source-of-truth: controlled single-tester external beta is ready only for `aiediting@reeditpro.com`; broad expansion and production remain blocked.
- Keep #577 excluded unless its Remotion runtime proof is repaired and externally validated.

## Safety

No PR merge, retarget, branch rewrite, IAM mutation, Google Group mutation, Cloud Run deploy, Supabase mutation, SQL execution, provider/model call, worker execution, media processing, final export, package installation, dependency mutation, or production unlock is allowed in the triage packet.
