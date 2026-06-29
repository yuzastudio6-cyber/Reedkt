# QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_SOURCE_IMPORT_1

## Summary

Create a fresh current-integration source-import packet for the QWEN2.5-VL controlled persisted worker dispatch real-dispatch lane. Use PR #1695 and #1690 as draft stack evidence, but do not blind-merge, retarget, or treat either draft PR as current source-of-truth.

## Required Inputs

- Start from the latest integration branch after `RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-DRAFT-STACK-TRIAGE-1`.
- Read PR #1695, PR #1690, and required lower stack evidence.
- Preserve the active external beta lane for `aiediting@reeditpro.com`.
- Preserve the single-tester real usage QA blocker `blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa` unless interactive gcloud reauthentication has been completed and a later guarded runner proves route readback.

## Allowed Scope

- Docs/status/diagnostics and source-import planning from current integration.
- Mock/source/smoke import only when the imported files are explicitly required and safe from current integration.
- Backend-only, approved-snapshot-only, credit-gated, private-artifact-gated QWEN dispatch contracts.

## Forbidden Scope

- No Cloud Run invocation or deployment.
- No QWEN inference.
- No provider/model call.
- No worker dispatch.
- No Supabase mutation or SQL.
- No route execution.
- No generated assets, signed URLs, public artifacts, media processing, render/export, credit mutation, beta expansion, production unlock, or package-lock mutation.

## Outcome

If the source import validates from current integration, open a non-draft PR with refreshed validation evidence and keep runtime disabled pending an explicit confirmation-gated real-dispatch execution packet. If source import is ambiguous or validation fails, open/keep draft with the exact blocker.

Product-ready end-to-end local OSS tools remains `0`.
