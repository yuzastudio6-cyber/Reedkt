# QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PREFLIGHT_1

## Summary

Run only after `RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-MOCK-ONLY-SOURCE-IMPORT-1` is merged and validated. This future packet must be confirmation-gated and may only validate a bounded preflight path before any real QWEN2.5-VL persisted worker dispatch attempt.

## Required Gate

The future runner must require an explicit confirmation environment variable before it can attempt any real preflight. Without that confirmation it must fail closed.

## Required Boundaries

- Approved plan snapshot required.
- Credit reservation required, with no spend unless a later packet approves execution.
- Private storage/source refs required; signed/public URLs are not source-of-truth.
- Idempotency key and duplicate-source guard required.
- Backend-only service-role lease boundary required.
- Cloud Run service URL and audience must be resolved only by backend-controlled runtime code.
- Identity token fetch, Cloud Run invocation, QWEN model import/load/inference, generated assets, Supabase mutation, SQL, credit mutation, beta expansion, and production unlock remain forbidden unless a later explicit packet approves them.

## Forbidden Scope

No full draft stack merge, Dockerfile changes, Supabase migrations, SQL execution, provider/model call, QWEN inference, Cloud Run invocation, worker dispatch, media processing, generated assets, public artifacts, signed URLs, credit mutation, final render/export, broad beta unlock, or production unlock may occur from this prompt alone.

## Source Gate Follow-Up

After `RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-PREFLIGHT-1`, the next prompt is `QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_CONFIRMED_PREFLIGHT_1`. It must use the current integration source gate and must not import the stacked draft runtime branches wholesale.
