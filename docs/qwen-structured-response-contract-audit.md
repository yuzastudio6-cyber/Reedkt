# Qwen Structured Response Contract Audit

RP-QWEN-00 audits existing structured-output contracts and the missing schemas needed before Qwen can support Marker Chat or other reasoning flows.

Common audit boundary: Qwen 3.7, Marker Chat, Secret Manager, backend-only, structured response, fallback, owner approval pending, no Qwen call, no provider call, no secret values inspected, no gcloud command, no runtime implementation.

## Existing Structured Output

- Reasoning-agent structured output already includes decisions, contract patches, QA findings, warnings, review requirements, and next-step hints.
- Existing validation checks for summary, decisions, and contract patch notes.
- Marker Chat deterministic extraction already creates structured marker intent records and panel models without model calls.

## Required Future Marker Chat Schemas

- `MarkerChatAssistantResponse`
- `MarkerIntentStructuredOutput`
- `MarkerClarificationQuestion`
- `MarkerConfirmationResponse`
- `MarkerSuggestionResponse`
- `MarkerCopyRiskWarning`
- `MarkerValidationFailureFallback`

## Validation Requirement

Qwen output must validate before saving. Invalid output must fall back to deterministic extraction and a safe assistant response. Failed validation must not write unsafe intent, start planning, call workers, render, upload, read media bytes, fetch URLs, or spend credits.
