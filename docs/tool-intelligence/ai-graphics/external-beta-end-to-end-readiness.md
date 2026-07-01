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
- External-beta ready now: true for controlled on-demand tool calls, using the accepted activated-launch readiness packet.
- Production ready now: false.
- Service-role queue smoke payload previews prepared: 21 / 21.
- Service-role queue smoke ready to execute in this committed/default environment: false.
- Saved service-role queue smoke proof accepted in this committed/default environment: false.
- Saved worker-dispatch smoke proof accepted in this committed/default environment: false.
- External-beta launch controls accepted in this committed/default environment: false.
- Activated-launch readiness accepted: true, from `docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.json`.
- Route-bound service-role queue-smoke operator-preflight evidence preserved through activated launch: 21 / 21.

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

Default legacy evidence, without the activated-launch packet:

- Beta technical evidence ready with provided evidence: 0 / 21.
- External-beta candidate ready with provided evidence: 0 / 21.
- Service-role queue smoke preflight payload previews prepared: 21 / 21.
- Service-role queue smoke preflight ready to execute: false.
- Saved service-role queue smoke proof accepted with provided evidence: false.
- Saved worker-dispatch smoke proof accepted with provided evidence: false.
- External-beta ready now: 0 / 21.

Current activated-launch evidence:

- External-beta activated-launch readiness accepted with provided evidence: true.
- Route-bound service-role queue-smoke operator-preflight evidence preserved: 21 / 21.
- External-beta ready now for controlled on-demand tool calls: 21 / 21.
- GPU runtime still starts only for a future accepted worker/tool-call job: true.
- Direct agent execution remains blocked: true.
- Production ready now: 0 / 21.

Full evidence mode, using the CLI with the accepted external-beta evidence admission bundle, the accepted external-beta launch-controls packet, and all required saved proof packets:

- Beta technical evidence ready with provided evidence: 21 / 21.
- External-beta candidate ready with provided evidence: 21 / 21.
- Override flags plus queue and worker proof, without the admission bundle, remain blocked at 0 / 21 external-beta candidates.
- Service-role queue smoke preflight ready to execute: true, when a ready preflight packet is supplied with `--external-beta-service-role-queue-smoke-preflight-packet`.
- Saved service-role queue smoke proof accepted with provided evidence: true, when an accepted proof packet is supplied with `--external-beta-service-role-queue-smoke-proof-packet`.
- Saved worker-dispatch smoke proof accepted with provided evidence: true, when an accepted proof packet is supplied with `--external-beta-worker-dispatch-smoke-proof`.
- External-beta launch controls accepted with provided evidence: true, when an accepted controls packet is supplied with `--external-beta-launch-controls`.
- External-beta candidate ready with provided evidence before the activated-launch packet: 21 / 21.

That means the evaluator can prove the complete candidate path when supplied with the required private/runtime admission bundle, a ready service-role queue smoke preflight packet, an accepted saved service-role queue smoke proof packet, an accepted saved worker-dispatch smoke proof packet, and accepted launch controls. The newer activated-launch readiness packet then promotes that accepted path to controlled on-demand external-beta tool-call readiness for all 21 tools, while still refusing direct agent execution, idle GPU runtime, public artifacts, or production readiness.

## Remaining Production Gates

- Separate production launch approval.
- Production support, incident, rollback, cost/concurrency, privacy, monitoring, and owner signoff.
- Live Tool Route, Worker, provider/model, browser/canvas/WebGL, GPU/model, storage, artifact, signed URL, and production gates remain closed until a final runtime approval explicitly opens them.

## No-Scope

This packet does not install dependencies, mutate `package-lock.json`, execute tools, execute routes, execute workers, call providers/models, run browser/WebGL/canvas runtime, start GPU/model runtime, download or load model weights, process media, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock production, merge PRs, close PRs, or retarget PRs.
