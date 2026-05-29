# Web App Navigation Policy

Phase 44C defines web shell navigation as explicit route IDs rather than ad hoc
links.

| Route ID | Path | Purpose |
| --- | --- | --- |
| `home` | `/` | Web shell overview and safety state. |
| `projects` | `/projects` | Project dashboard. |
| `project_intake` | `/projects/new` | Disabled/mock-safe intake surface. |
| `project_overview` | `/projects/:projectId` | Project state and blockers. |
| `editor_workspace` | `/projects/:projectId/editor` | Static editor workspace shell. |
| `job_queue` | `/projects/:projectId/jobs` | Mock-safe job/progress visibility. |
| `artifact_library` | `/projects/:projectId/artifacts` | Private artifact review. |
| `system_readiness` | `/system/readiness` | Report-driven readiness status. |
| `compute_routes` | `/system/compute-routes` | Informational compute route map. |
| `settings` | `/settings` | Disabled launch/execution controls. |
| `not_found` | `*` | Unknown route fallback. |

Navigation may link to these pages, but it must not imply that desktop, local
worker, public delivery, production launch, external beta, or broad real media
testing is available.
