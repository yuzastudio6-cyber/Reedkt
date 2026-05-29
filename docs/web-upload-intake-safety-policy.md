# Web Upload Intake Safety Policy

Phase 44C shows the project intake surface without enabling real upload.

Upload and intake controls are disabled/mock-safe until a dedicated later phase
adds browser-safe authentication, storage intent creation, upload finalization,
artifact registration, and backend-owned validation.

The web shell must not:

- upload real user media
- mutate private GCS directly
- use signed URLs as the source of truth
- expose service-role secrets
- trigger media analysis or worker execution
- imply broad real media testing is allowed

Until those backend and storage gates exist, intake remains a visible product
surface with execution disabled.
