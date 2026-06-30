# Fail-Closed Boundary

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-CONTRACT-1`

Boundary status: `fail_closed_contract_ready_for_disabled_worker_scaffold`

## Required Rejections

The future disabled worker scaffold must reject:

- missing approved plan snapshot;
- missing approval record;
- missing credit reservation or no-spend fixture policy;
- missing worker lease;
- missing idempotency key;
- raw command strings;
- unknown command template IDs;
- arbitrary private/user media;
- public URL source-of-truth;
- signed URL source-of-truth;
- files missing from the private input manifest;
- checksum mismatch;
- missing expected output manifest schema;
- missing expected QA report schema;
- missing cleanup policy;
- any request for final render/export;
- any request for broad external beta or production behavior.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, service-role route execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, IAM mutation, Google Group membership mutation, broad external beta audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, GStreamer execution in this contract phase, MKVToolNix execution in this contract phase, GPAC/MP4Box execution in this contract phase, VapourSynth execution in this contract phase, Revideo execution in this contract phase, FILM execution in this contract phase, QWEN execution in this contract phase, AI Graphics execution, FFmpeg/FFprobe execution in this contract phase, Docker execution in this contract phase, Remotion execution in this contract phase, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, Cloud Run readback, Cloud Run service update, or broad service-role handler was enabled.
