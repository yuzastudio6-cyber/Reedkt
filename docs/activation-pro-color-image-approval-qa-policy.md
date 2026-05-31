# Phase 40A Pro Color/Image QA Policy

Phase 40A QA is static. It verifies that the approval report builds and that
all execution gates remain closed.

Required smoke coverage:

- evidence and license records exist for OpenColorIO, OpenImageIO, and Kornia
- tool ownership scope is explicit
- required blocker risks exist
- future sequence is Phase 40B, Phase 40C, Phase 40D
- command plans are text-only and blocked in Phase 40A
- package scripts exist
- runtime, media, provider, Revideo, production, beta, paid production, and
  broad-media gates are false

Phase 40A cannot clear generated-fixture, controlled real-video, final-delivery,
or production QA. Those remain future-phase gates.
