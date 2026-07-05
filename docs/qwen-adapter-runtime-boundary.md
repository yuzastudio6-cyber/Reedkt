# Qwen Adapter Runtime Boundary

Implementation date: 2026-06-18.

Qwen 3.7 Max is the configured default for ReeditPro reasoning roles. RP-MODEL-03 adds only the backend skeleton and safety boundary for a future Qwen adapter.

## Not Implemented

- no Qwen API call;
- no SDK or HTTP client;
- no token usage;
- no secret value access;
- no frontend invocation;
- no provider runtime;
- no worker, render, generation, or credit execution.

## Future Requirements

A real Qwen adapter must be backend-owned, read secrets only through approved Secret Manager/runtime boundaries, enforce provider enablement and rate limits, respect user approval and credit gates, and return structured outputs that pass ReeditPro validation.

## RP-PREF-VIDEO-08 QA Boundary

Preference DNA QA checks Qwen bridge packages but never invokes Qwen. It requires `providerCallMade=false`, `qwenCallMade=false`, structured inputs, and do-not-copy rules before DNA can be treated as safe mock planning metadata.
