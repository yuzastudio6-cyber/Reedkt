# AI Graphics Beta Evidence Bundle

Decision: `ai_graphics_beta_evidence_bundle_validator_prepared_with_fail_closed_defaults`

This record answers the practical install question for the 21 AI graphics tools:
which tools are installed or represented for their intended ReeditPro surface,
and which tools still lack the evidence required before beta tool calls.

## Current Answer

- Tools in this lane: 21.
- Installed or represented for the planned ReeditPro surface: 21.
- Mapped to production registry tool IDs: 21.
- Selectable by the agent for planning/study metadata: 21.
- Beta-ready with no supplied evidence bundle: 0.
- Blocked with no supplied evidence bundle: 21.
- Technical evidence ready for owner review when every proof packet and non-owner gate is supplied: 21.
- Beta-eligible when every required proof packet, non-owner evidence gate, and owner approval gate is supplied: 21.

## Required Evidence Bundle

The validator stays fail-closed until all of these are supplied:

- Node runtime proof packet for the 13 JS graphics tools.
- Browser runtime proof packet for the seven browser/player/canvas/WebGL tools.
- Satori font runtime proof packet.
- Approved plan snapshot gate.
- Credit reservation gate.
- Artifact boundary gate.
- Tool Route gate.
- Worker gate.
- Browser/canvas/WebGL sandbox proof.
- Native NVIDIA L4 GPU runtime proof packet.
- Reviewed private model-weight manifest packet.
- Internal beta owner approval.

The first eleven items form the technical owner-review packet. The final
`internal_beta_owner_approval` item is intentionally separate: technical
evidence can be ready for owner review before the owner grants the beta gate.

Legacy boolean override flags for GPU proof or model-weight manifests are ignored
by this bundle. They may be useful in lower-level simulation diagnostics, but
they do not satisfy all-21 beta evidence.

The reviewed private model-weight manifest packet must include exact per-tool
validation rows for `sam2`, `birefnet`, `real_esrgan`, `rembg`, and
`transparent_background`. Count-only packets are rejected even when their summary
counters say five records passed. Each accepted row must match the expected
template, carry `present_private_ref_not_logged`, have no validation errors, and
keep `approvedForAgentExecutionNow` false.
The packet must also prove `privateArtifactRefNamespaceRequired=true` so stale
evidence from before reviewed private namespace enforcement cannot satisfy beta
readiness.

The native GPU runtime proof packet must also include exact per-profile
validation rows for `gpu_worker_ai_graphics`, `sam2`, `birefnet`, and
`real_esrgan`. Count-only GPU proof packets are rejected even when their summary
counters say four results passed. Each accepted row must prove approved probe
metadata, required imports, `nvidia-smi`, CUDA, model-manifest checks, raw ref
redaction, and false runtime side-effect fields.
The GPU proof packet must carry the `model_manifest_private_namespace_enforced`
proof check and `privateArtifactRefNamespaceRequired=true`.

## Tool Groups

The 13 JavaScript graphics tools are installed through the Node lockfile surface:
`d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`,
`lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`.

The eight ML/GPU tools are represented by GPU worker install targets and must
remain GPU-runtime targeted: `torch_torchvision`, `transformers`, `sam2`,
`birefnet`, `real_esrgan`, `kornia`, `rembg`, and
`transparent_background`.

The required runtime target map is exact and on-demand only:

- `torch_torchvision`: `native_linux_amd64_nvidia_l4_gpu_worker`
- `transformers`: `native_linux_amd64_nvidia_l4_gpu_worker`
- `sam2`: `native_linux_amd64_nvidia_l4_sam2_runtime`
- `birefnet`: `native_linux_amd64_nvidia_l4_birefnet_runtime`
- `real_esrgan`: `native_linux_amd64_nvidia_l4_real_esrgan_runtime`
- `kornia`: `native_linux_amd64_nvidia_l4_gpu_worker`
- `rembg`: `native_linux_amd64_nvidia_l4_gpu_worker`
- `transparent_background`: `native_linux_amd64_nvidia_l4_gpu_worker`

GPU runtime is not an idle or standing service in this bundle. It is a future
native NVIDIA L4 worker target that may start only for an approved worker or
tool-call handoff. Proof/runtime containers must be ephemeral
`docker run --rm --gpus all` jobs that release after the command or future job
finishes, and CPU fallback is not allowed for these heavy runtime paths.

## No Runtime Unlock

The bundle validator does not install dependencies, mutate `package-lock.json`,
execute tools, run Tool Routes, run Workers, call providers/models, run
browser/WebGL/canvas runtime, run GPU runtime, download or load model weights,
process media, mutate Supabase, upload to GCS, create signed URLs, create public
artifacts, unlock internal beta, unlock external beta, or unlock production.
