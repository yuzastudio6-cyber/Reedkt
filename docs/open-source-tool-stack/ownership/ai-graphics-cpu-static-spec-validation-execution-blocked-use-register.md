# AI Graphics CPU Static Spec Validation Execution Blocked-Use Register

Decision: `blocked_pending_cpu_static_dependency_install_from_lock`

Blocked cause: approved CPU/static packages are missing from the source package manifests, and dependency mutation is forbidden.

Still blocked:

- dependency installation outside `npm ci`
- adding `d3`, `vega-lite`, `vega`, `satori`, `@svgdotjs/svg.js`, or `@viz-js/viz`
- package-lock mutation
- import smoke execution
- synthetic/static fixture execution
- actual tool execution
- browser/WebGL/canvas runtime
- Tool Route execution
- Worker execution
- provider/model runtime
- Supabase/SQL/GCS
- signed URLs
- public artifacts
- raw prompt execution
- internal beta
- external beta
- production

Track B remains excluded under `TRACK_B_MEDIA_OSS_STEWARD`; Track A render/export remains excluded via PR #544.
