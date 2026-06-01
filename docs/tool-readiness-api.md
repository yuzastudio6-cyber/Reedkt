# Tool Readiness API

Prompt 13 adds read-only readiness routes:

- `GET /v1/tool-readiness`
- `GET /v1/tool-readiness/:toolId`
- `GET /v1/tool-readiness/diagnostics/summary`

The routes require authentication and return static readiness metadata. They do not mutate rows, execute tools, probe workers, call providers, process media, or create signed URLs.

Unknown tools fail closed as `not_configured`.

## Response Shape

Responses are wrapped under `toolReadiness` and include:

- policy summary
- tool readiness records
- runtime requirement metadata
- diagnostics summary
- blocked reasons where applicable

## Production Status

The API metadata marks these routes `mock_only` and `diagnostic_only`. They are safe route contracts for planning/readiness diagnostics, not production runtime execution.
