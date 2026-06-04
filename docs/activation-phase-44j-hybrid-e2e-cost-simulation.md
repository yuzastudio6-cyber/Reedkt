# Phase 44J Cost Simulation

Cost simulation uses Phase 44H static cost estimator evidence and a pure Phase 44J guardrail check.

Guardrails:

- Warning threshold: `$1/run`.
- Hard block threshold: `$5/run`.
- VLM/GPU, Demucs, provider, production, broad-media, and over-threshold scenarios fail closed.

The simulation does not call Billing APIs, query project billing, run Cloud jobs, execute routes, process media, or call providers. It produces planning metadata only and cannot approve live execution or paid production.
