# Web Production Shell

Phase 44C adds the visible web production shell for ReeditPro while preserving
the Phase 44B transitional source layout. `apps/web` is still the canonical web
boundary, but active React/Vite code remains under root `src`.

The shell lives under `src/web-shell` and defines route data, navigation,
mock-safe fixtures, safety policy, readiness state, and React panels for the
main product surfaces.

## Route And Page Architecture

The shell separates:

- home and project dashboard
- disabled project intake
- project overview
- editor workspace
- job queue
- private artifact library
- system readiness
- compute route visibility
- settings and not-found handling

Routes are structured data first in `src/web-shell/web-shell-routes.ts` and are
then wired through the existing root React Router entry.

## Execution Boundary

Phase 44C does not process media, upload user files, run tools, call providers,
query live GCP, expose secrets, or execute local compute. Upload, run AI,
render, export, public delivery, and local worker controls are disabled or
mock-safe by default.

Phase 44D should connect approved browser-safe backend surfaces while keeping
workers, service-role access, private artifacts, model policy, and tool
execution server-owned.
