# Tool Matrix

| Tool | Evidence | Rollup status | Readiness |
| --- | --- | --- | --- |
| `gstreamer_render_pipeline_support` | #2113 route-worker runtime evidence, #2192 confirmed external-agent evidence reconciliation | `ready_narrow_external_agent_controlled_generated_fixture_runtime_path_only` | `ready_for_controlled_generated_fixture_runtime_handoff_only` |
| `mkvtoolnix_container_validation` | #2113 route-worker runtime evidence, #2192 confirmed external-agent evidence reconciliation | `ready_narrow_external_agent_controlled_generated_fixture_runtime_path_only` | `ready_for_controlled_generated_fixture_runtime_handoff_only` |
| `ffmpeg_trackb_owned_shared_dependency` | Not used in accepted evidence | `not_run_not_claimed_by_this_rollup` | `requires_trackb_coordination_before_any_future_use` |
| `ffprobe_trackb_owned_shared_dependency` | Not used in accepted evidence | `not_run_not_claimed_by_this_rollup` | `requires_trackb_coordination_before_any_future_use` |
| `remotion_runtime` | #577 excluded | `not_source_of_truth_for_this_rollup` | `blocked_pending_separate_external_validation` |

Scope note: this matrix does not make any tool product-ready or production-ready. It only records readiness for the narrow controlled generated fixture external-agent runtime path.
