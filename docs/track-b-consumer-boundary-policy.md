# Track B Consumer Boundary Policy

Track B manifests describe ownership and consumer boundaries. They do not authorize raw execution.

General boundaries:

- Server/worker-only tools must not be imported into browser/frontend bundles.
- Frontend code must not receive service-role secrets.
- Workers must execute approved plan snapshots and approved artifact scopes only.
- Raw chat execution and direct execution from model output remain blocked.
- Production and broad media routing remain blocked.

Sharp/libvips boundary:

- Track B owns core runtime hardening, server/worker policy, private artifact policy, and dependency caveats.
- Web search, AI Tools graphics, and Track A visual pipeline are consumers only.
- Track A visual/render work remains untouched by this phase.
