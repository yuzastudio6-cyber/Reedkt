# Web Editor Workspace Shell

The Phase 44C editor workspace is a browser UI shell only. It contains panels
for:

- media preview placeholder
- timeline placeholder
- transcript and captions metadata
- tool plan
- inspector
- export review

The preview is static, timeline state is fixture-backed, and export controls
are disabled. Final export requires a future backend job, private artifacts, and
QA gates. Desktop/local worker acceleration is future-only, and the current web
shell does not process media locally.

Later phases may connect these panels to approved backend APIs, but browser code
must not import server workers, service-role secrets, model weights, provider
execution, raw tool adapters, Cloud Run job execution, or heavy media/AI runtime.
