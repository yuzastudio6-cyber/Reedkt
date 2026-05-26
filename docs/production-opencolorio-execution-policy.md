# Production OpenColorIO Execution Policy

OpenColorIO is the future color-management and look-transform engine for professional output transforms, ACES-style handoff, display transforms, and generated asset matching.

M15B keeps OpenColorIO skip-safe:

- execution must be explicitly enabled;
- config and LUT paths must be safe local/private references;
- readiness/manual review must pass before production use;
- dry-run creates transform metadata only;
- unavailable tools return skip reasons.

No unsafe config paths, raw user args, package installs, or final exports are introduced in M15B.
