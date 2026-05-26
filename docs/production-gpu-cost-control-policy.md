# Production GPU Cost Control Policy

L4 is the default GPU class for future launch planning. RTX PRO 6000 is future, premium, and manual-approval-only.

M17 sets conservative GPU concurrency, retry, duration, workspace spend placeholders, and a GPU kill switch. Production GPU jobs remain disabled until readiness, model weights, cost, and legal reviews pass.

No GPU job is run by M17.
