# Project Edit Session Memory Future Qwen Plan

RP-EDITSESSION-08 intentionally does not call Qwen.

Future Qwen-assisted memory summarization may be considered only after owner approval and after the model-runtime, Secret Manager, backend route, auth/RLS, queue/worker, observability, and cost gates exist.

Future work should preserve these rules:

- frontend code never calls Qwen or reads provider secrets;
- memory writes stay behind backend route and service boundaries;
- user-visible summaries must preserve do-not-copy and safety policies;
- embeddings/vector DB work is a separate gated milestone;
- mock memory remains available as a fallback for internal testing.

Recommended next prompt after RP-EDITSESSION-08 is RP-EDITSESSION-09 — Version, Revision, and Preview History.
