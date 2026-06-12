# Model Orchestration Provider Dry-Run Fail-Closed Policy

The provider dry-run blocks on invalid JSON, schema mismatch, provider timeout or error, model alias unavailability, missing secret refs, unsafe output, cost guardrail failures, raw prompt pass-through, worker/tool/route execution requests, public artifact requests, signed URL requests, and production mutation suggestions.

The local schema-invalid fixture is not a provider call and must fail closed.
