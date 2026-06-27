# Provider Runtime Boundary

Packet: `RP-EXTERNAL-BETA-PROVIDER-MODEL-CALL-POLICY-CLOSURE-1`

Provider/model-call policy: `closed_for_docs_source_truth_no_runtime_calls`

Provider/model runtime: `disabled_by_default`

Provider/model calls executed: `none`

Model calls executed: `none`

Secret payload access: `none`

Raw prompt execution: `false`

Frontend provider calls: `forbidden`

Backend-only provider adapters: `required`

## External Beta Rule

Provider and model routes may exist as planning data, but executable provider calls remain blocked until a later explicitly confirmed runtime packet proves all of these gates at once:

- approved plan snapshot exists and is immutable for the work item;
- credit reservation exists, is reserved, and is linked to the approved snapshot;
- idempotency key exists for the provider request;
- provider route obeys `model-routing-policy.md`, including Basic/Pro no-Veo and Premium final-fallback-only Veo;
- prompt payload is built from approved prompt plans, not raw chat;
- server-side secret isolation is in place, with no frontend credential exposure;
- cost cap and rate policy are enforced before dispatch;
- provider output lands only in private artifact manifests with checksums and QA;
- fallback/retry policy is approved before alternate provider use;
- no signed URL or public artifact is source-of-truth for provider input or output.

## Current Runtime Interpretation

This packet closes the policy ambiguity by making the fail-closed posture source-of-truth. It does not approve provider execution. Any future real call must be a separate confirmation-gated packet with one bounded provider, one target, one request class, one approved snapshot class, one credit reservation class, and explicit cleanup/QA evidence.

## Blocked Until Future Runtime Packet

- OpenAI / GPT-Image provider call: `blocked_disabled_by_default`
- Wan provider call: `blocked_disabled_by_default`
- Hailuo provider call: `blocked_disabled_by_default`
- Veo provider call: `blocked_disabled_by_default`
- Lyria provider call: `blocked_disabled_by_default`
- Mirelo / MMAudio provider call: `blocked_disabled_by_default`
- Provider webhook state mutation: `blocked_pending_signed_backend_webhook_policy`
- Frontend provider execution: `forbidden`
- Raw chat provider execution: `forbidden`
