# Phase 44H Cost Guardrail Policy

Phase 44H uses planning guardrails only.

- Warning threshold: `$1` per synthetic planning run.
- Hard block threshold: `$5` per synthetic planning run.
- GPU cost requires future explicit approval.
- Provider cost requires a future provider phase.
- Broad media cost is always blocked.
- Production cost requires a production gate.
- Disabled tools block rather than estimate.
- Route execution blocks until Phase 44J or later.

Unknown rates warn for noncritical metadata scenarios and block runtime/cloud scenarios when needed.
