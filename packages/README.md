# ReeditPro Shared Package Boundary

The `packages` directory is reserved for shared code that can serve the web app, future desktop app, and server without collapsing platform ownership.

Phase 44A creates only package boundaries. It does not add workspaces, package manifests, build config, runtime dependencies, desktop framework packages, or executable local workers.

## Package Boundaries

- `packages/shared`: shared pure types and utilities.
- `packages/ui`: reusable UI components.
- `packages/platform`: product mode and platform boundary types.
- `packages/editor-core`: pure timeline/editor logic.
- `packages/compute-routing`: future compute decision policy types.

Server-only secrets, private artifacts, Cloud Run orchestration, model weights, provider clients, and heavy media execution stay outside shared packages.
