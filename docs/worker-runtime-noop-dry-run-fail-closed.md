# Worker Runtime No-Op Dry-Run Fail-Closed Policy

Invalid fixtures fail closed before any queue enqueue, worker process spawn, sidecar execution, tool execution, route execution, provider call, Docker, Cloud Run, Cloud Build, Supabase write, media processing, public artifact, signed URL, external beta, paid production, or production action.

Fail-closed classes include raw prompt input, provider response input, plan snapshot candidate input, invalid artifact scope, public artifact request, signed URL source-of-truth request, production mutation, broad media request, real tool or worker execution request, Docker or Cloud Run request, and missing audit/cost metadata.
