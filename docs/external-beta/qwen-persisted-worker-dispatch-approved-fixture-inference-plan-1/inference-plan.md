# Approved Fixture Inference Plan

Packet: `RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-PLAN-1`

## Planned Runtime Shape

- Selected runtime: `google_cloud_run_gpu`.
- Selected GPU: `nvidia_l4`.
- Region: `us-central1`.
- Scale posture: `scale_to_zero_required`.
- Minimum instances: `0`.
- Initial maximum instances: `1`.
- CPU fallback: `false`.
- Runtime scope: `one_request_approved_fixture_inference_only`.

## Required Envelope

The future approval packet must name:

- approved snapshot fixture;
- persisted worker dispatch references;
- private source-of-truth references;
- QWEN metadata request envelope;
- private invoke transport dependencies;
- response schema and result handling;
- QA/audit/cost and no-spend credit boundary;
- cleanup policy;
- retry policy;
- beta lock policy.

## Current Runtime Status

- Approved fixture inference approved now: `false`.
- Model import run in this packet: `false`.
- Model load run in this packet: `false`.
- vLLM engine initialized in this packet: `false`.
- Inference run in this packet: `false`.
- Generated assets created: `false`.
- Supabase touched: `false`.
- SQL executed: `false`.
- Credit mutation created: `false`.
- Beta ready: `false`.
- Production ready: `false`.
