# Qwen Safety Validation Fallback Audit

RP-QWEN-00 audits the safety and fallback requirements for future Qwen 3.7 runtime work.

Common audit boundary: Qwen 3.7, Marker Chat, Secret Manager, backend-only, structured response, fallback, owner approval pending, no Qwen call, no provider call, no secret values inspected, no gcloud command, no runtime implementation.

## Required Safety Checks

- Prompt redaction before runtime calls.
- No secrets in prompts, logs, errors, responses, or persisted metadata.
- No user media bytes, uploads, file-byte reads, or URL fetches in prompt packages.
- No direct execution of model output.
- Strict schema validation before saving Qwen output.
- Copy-risk and do-not-copy guardrails.
- Safe assistant response on validation/runtime failure.
- Deterministic extraction fallback for Marker Chat.

## Existing Support

Reasoning-agent validation already blocks secret-like values, raw media/binary input, frontend access, and provider-call flags. Marker Chat already has deterministic intent extraction and mock assistant response fallback.

## Missing Work

Future Qwen runtime needs task-specific schema validators, redacted logging, timeout/retry failure mapping, fake-adapter tests, and owner-approved fallback policy before real execution.

## RP-QWEN-BETA-01 Safety Update

Task-specific `QwenMarkerChatStructuredResponse` validation, redacted transport previews, timeout/rate-limit/provider failure fallback, and deterministic Marker Chat fallback now exist for the beta backend bridge. Unsafe or invalid output is not persisted as Qwen output.
