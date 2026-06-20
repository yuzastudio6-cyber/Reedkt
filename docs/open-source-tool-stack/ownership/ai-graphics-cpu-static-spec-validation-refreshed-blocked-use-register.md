# AI Graphics CPU Static Spec Validation Refreshed Blocked-Use Register

Decision: `ai_graphics_cpu_static_spec_validation_refreshed_execution_passed_with_warnings`

Blocked or deferred use remains:

- `echarts`: browser chart runtime deferred.
- `lottie_web`: animation runtime deferred.
- `animejs`: animation runtime deferred.
- `three_js`: browser/WebGL/canvas sandbox deferred.
- `pixi_js`: browser/WebGL/canvas sandbox deferred.
- `konva`: browser/WebGL/canvas sandbox deferred.
- `babylonjs`: browser/WebGL/canvas sandbox deferred.
- Track B tools: owned by `TRACK_B_MEDIA_OSS_STEWARD`; Atlas may reference but cannot claim, install, prove, or execute them.
- Track A render/export tools: outside this lane via PR #544.

The lane does not approve runtime readiness, E2E proof, internal beta, external beta, or production.
