# Qwen DashScope Key Or Service Operator Fix

Proceed only from `docs/activation-model-orchestration-qwen-auth-repair-reports/qwen_auth_repair_readiness_report.json`.

Current decision: `blocked_pending_dashscope_key_replacement`.

Operator remediation must keep secrets out of the repo and may address only the exact blocker: DashScope key replacement, Model Studio/Bailian service activation, Qwen model access, region/base URL selection, or Singapore WorkspaceId review.

Do not run DeepSeek, workers, tools, routes, media processing, Supabase writes, public artifacts, signed URLs, production, external beta, or paid production in the remediation packet.
