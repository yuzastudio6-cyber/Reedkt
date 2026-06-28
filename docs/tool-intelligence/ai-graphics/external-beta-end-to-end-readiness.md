# AI Graphics External-Beta End-to-End Readiness

Decision: `ai_graphics_external_beta_end_to_end_readiness_prepared_with_remaining_blocks`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

This packet is the single end-to-end checkpoint for the 21 AI graphics tools. It ties together proper install surface, production registry mapping, canonical ranking/tool-call selection, GPU targeting, cross-owner duplicate checks, external-beta runtime evidence, and current execution gates.

## Current Result

- Tools covered: 21.
- Product-facing capabilities covered: 12.
- Installed or install-proof-targeted for the correct ReeditPro surface: 21.
- Production mapped tools: 21.
- Duplicate AI graphics production mappings: 0.
- Cross-owner production mapping conflicts: 0.
- GPU-heavy tools targeting GPU runtime: 8.
- Heavy tools incorrectly targeting CPU: 0.
- Agent can select tools for planning/study metadata: true.
- Agent can execute tools now: false.
- External-beta ready now: false.
- Production ready now: false.
- Service-role queue smoke payload previews prepared: 21 / 21.
- Service-role queue smoke ready to execute in this committed/default environment: false.
- Saved service-role queue smoke proof accepted in this committed/default environment: false.

## Runtime Split

The 13 JavaScript graphics tools remain on the Node/package-lock or browser/render-worker planning surfaces. The eight heavy model tools remain on native NVIDIA L4 GPU worker targets:

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`

Those eight tools do not CPU-fallback. GPU startup remains on-demand only and is allowed only for a future accepted worker/tool-call job. No idle GPU runtime is approved.

## Evidence Modes

Default committed evidence:

- Beta technical evidence ready with provided evidence: 0 / 21.
- External-beta candidate ready with provided evidence: 0 / 21.
- Service-role queue smoke preflight payload previews prepared: 21 / 21.
- Service-role queue smoke preflight ready to execute: false.
- Saved service-role queue smoke proof accepted with provided evidence: false.
- External-beta ready now: 0 / 21.

Full evidence mode, using the CLI with all required proof flags:

- Beta technical evidence ready with provided evidence: 21 / 21.
- External-beta candidate ready with provided evidence: 21 / 21.
- Service-role queue smoke preflight ready to execute: true, when a ready preflight packet is supplied with `--external-beta-service-role-queue-smoke-preflight-packet`.
- Saved service-role queue smoke proof accepted with provided evidence: true, when an accepted proof packet is supplied with `--external-beta-service-role-queue-smoke-proof-packet`.
- External-beta ready now: 0 / 21.

That means the evaluator can prove the complete candidate path when supplied with the required private/runtime evidence, a ready service-role queue smoke preflight packet, and an accepted saved service-role queue smoke proof packet, while still refusing to claim live external-beta or production readiness from committed docs alone.

## Remaining End-to-End Gates

- Internal beta runtime soak evidence.
- Service-role queue smoke preflight in the non-production server environment.
- Saved service-role queue smoke proof from that non-production smoke.
- External-beta worker dispatch smoke proof.
- External-beta QA evidence.
- External-beta cost, concurrency, privacy, and rollback evidence.
- External-beta incident-response evidence.
- External-beta owner approval.
- Live Tool Route, Worker, provider/model, browser/canvas/WebGL, GPU/model, storage, artifact, signed URL, beta, and production gates remain closed until a final runtime approval explicitly opens them.

## No-Scope

This packet does not install dependencies, mutate `package-lock.json`, execute tools, execute routes, execute workers, call providers/models, run browser/WebGL/canvas runtime, start GPU/model runtime, download or load model weights, process media, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock external beta traffic, unlock production, merge PRs, close PRs, or retarget PRs.
