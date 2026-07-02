# Production Frontend Backend Boundary Policy

Frontend code may display plans, approvals, progress, and previews, but it must not import server workers, heavy tool adapters, service-role code, provider SDK calls, deployment scripts, or local media execution.

Workers execute approved plan snapshots on backend-controlled infrastructure. The browser never runs production FFmpeg, GPU AI, provider, render, or service-role mutation code.
