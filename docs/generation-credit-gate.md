# Generation Credit Gate

The generation credit gate applies the approval/reservation rule to all expensive work:

- music generation;
- SFX generation;
- Stroke Motion generation;
- Graphic Design / VisualExplain generation;
- Real Motion generation;
- AI video/provider generation;
- preview render;
- final export;
- worker jobs.

## Worker And Provider Boundary

Workers and provider adapters should validate the credit gate before running. RP-FIX-09 adds shared gate helpers and mock validation adapters for Lyria and SFX worker validation.

RP-FIX-10 adds job-level gates around those worker adapters. A job can be queued in mock mode only when required plan, credit, request, timing, asset, provider, and workspace gates pass.

RP-FIX-11 adds worker lease and idempotency checks around mock dispatch. A valid credit reservation is necessary but not sufficient for production: future workers also need a claimed lease, live heartbeat, and safe idempotency state before provider/render execution.

## Render Boundary

Preview render and final export routes must require approved estimates and reservations when credits apply. The mock render service now asks the shared gate before creating render jobs.

## Remaining Work

Real provider calls, render execution, queue creation, and spend/refund writes remain disabled until a deployed backend runtime enforces these checks transactionally.
