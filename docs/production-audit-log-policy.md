# Production Audit Log Policy

Audit events include approved snapshot creation, worker job creation/execution, tool run recording, artifact creation, QA gate failure, final export creation, signed URL generation, deletion request, model weight approval, license review, cost limit hit, and kill switch toggle.

Audit records must store sanitized summaries only. Secrets, raw prompts, auth headers, cookies, signed URLs, and sensitive local paths are forbidden.
