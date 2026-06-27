# QWEN2.5-VL Stack Map

Stack status: `candidate_for_fresh_integration_rollup_bridge`

Open QWEN2.5-VL PR count: `96`

Non-draft QWEN2.5-VL PR count: `73`

Draft QWEN2.5-VL PR count: `23`

Mergeable/CLEAN QWEN2.5-VL PR count: `96`

Dirty QWEN2.5-VL PR count: `0`

## Lower Stack Edge

- #982 `[video] Qwen2.5-VL stack tool integration`
- #985 `[video] Qwen2.5-VL revision checksum plan`
- #993 `[video] Qwen2.5-VL controlled private cache manifest`
- #997 `[video] Qwen2.5-VL private loader import gate`
- #1001 `[video] Qwen2.5-VL runtime dependency install plan`

## Upper Stack Edge

- #1254 `QWEN2_5_VL approved fixture inference service source`
- #1264 `QWEN2_5_VL approved fixture inference service deploy`
- #1269 `QWEN2_5_VL approved fixture inference smoke result`
- #1279 `QWEN2_5_VL approved fixture inference smoke fix`
- #1282 `QWEN2_5_VL approved fixture result review`

## Decision

Do not merge the stacked PRs directly into integration from this triage packet.

Next safe action: create `QWEN2_5_VL_EXTERNAL_BETA_STACK_INTEGRATION_ROLLUP_1` from the current integration branch. That rollup should read the stacked source evidence, select the accepted top-of-stack source, resolve any stale-base drift, and produce a fresh integration-based PR with scoped docs/diagnostics and only the runtime source changes that are still required and safe.
