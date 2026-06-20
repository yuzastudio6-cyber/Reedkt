# AI Graphics CPU Static Spec Validation Execution Source Lockfile

Decision: `blocked_pending_cpu_static_dependency_install_from_lock`

Run id: `ai-graphics-cpu-static-spec-validation-local-static`

Base ref: `origin/codex/rp-ai-graphics-draft-package-proof-cpu-static-spec-validation-approval`

Head branch: `codex/rp-ai-graphics-draft-package-proof-cpu-static-spec-validation-execution`

PR #607 remained open/draft/MERGEABLE at `12cfc4f29e55db7a5b105ecfc3aba21480396435` during execution preflight. PR #604/#602/#598/#594/#589/#582 remained open/draft/MERGEABLE. PR #425/#433/#441 remained merged with `a055ef045db2a6ce127a044bee6219d5933532c3`, `dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0`, and `d174de59471eacf05bed5a5511d661f2e5ba9f0f`. PR #543 remained open/draft/MERGEABLE. PR #542 and PR #544 remained merged context.

No exact CPU/static execution PR, remote branch, or worktree existed before this branch was created.

The source package/lock preflight found missing dependency declarations for all approved CPU/static packages:

| Tool | package name | package.json declared | package-lock declared |
| --- | --- | --- | --- |
| `d3` | `d3` | false | false |
| `vega_lite` | `vega-lite` | false | false |
| `vega` | `vega` | false | false |
| `satori` | `satori` | false | false |
| `svgdotjs_svg_js` | `@svgdotjs/svg.js` | false | false |
| `viz_js` | `@viz-js/viz` | false | false |

Track B owner rule: `TRACK_B_MEDIA_OSS_STEWARD`; Atlas cannot claim, install, prove, or execute Track B tools. Track A render/export remains excluded via PR #544.
