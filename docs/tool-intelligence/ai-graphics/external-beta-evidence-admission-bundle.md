# AI Graphics External-Beta Evidence Admission Bundle

Decision: `ai_graphics_external_beta_evidence_admission_bundle_prepared_with_runtime_blocks`

This packet is the external-beta bridge between the all-21 technical proof bundle and the external-beta launch go/no-go. It accepts an external-beta admission candidate only when both of these are true:

- the beta technical evidence bundle is accepted for all 21 AI graphics tools;
- private or backend external-beta evidence refs are accepted for all 21 tools.

It does not enable tool execution. External beta still requires launch go/no-go, runtime admission, approved plan snapshot, credit, Tool Route, Worker, private artifact, feature flag, rollout, cost, concurrency, rollback, support, and incident-response gates.

Summary-only technical evidence is rejected. The source beta evidence bundle must carry detailed install, production mapping, planning, shared gate, JS runtime proof, model-weight review, native GPU proof, native GPU proof collection, private artifact namespace, GPU policy, per-tool coverage, and empty technical-gap fields before the admission bundle can count technical evidence for all 21 tools.

For the stricter external-beta path, the admission CLI also supports direct source-proof packet intake. Use `--require-source-proof-packets` with the model-weight manifest review packet, native GPU runtime proof result packet, external-beta native GPU proof collection packet, committed or explicit JS runtime proof packets, and the external-beta private evidence packet. Raw model-weight and GPU proof component packets alone are rejected until the assembled collection packet proves private evidence intake and native proof collection together. In that mode, a prebuilt beta evidence summary without source proof packets is rejected even if the summary claims all technical gates passed.

## Tools

The bundle covers all 21 AI graphics tools:

`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`.

## External Evidence Flow

1. Accept the technical proof bundle for all 21 tools.
2. Accept private/backend external-beta evidence refs for all 21 tools.
3. Feed the admission candidate into external-beta launch go/no-go.
4. Keep runtime blocked until runtime admission explicitly approves a scoped external-beta call.

Strict source-proof admission command shape:

```bash
npm run --silent ai-graphics:external-beta-evidence-admission-bundle -- \
  --require-source-proof-packets \
  --all-shared-gates-passed \
  --browser-canvas-webgl-sandbox-passed \
  --use-committed-js-runtime-proofs \
  --model-weight-manifest-review-packet <private-review-packet.json> \
  --gpu-runtime-proof-result-packet <native-gpu-proof-result-packet.json> \
  --external-beta-native-gpu-proof-collection-packet <native-gpu-proof-collection-packet.json> \
  --external-beta-evidence-packet <private-external-beta-evidence-packet.json>
```

## GPU Policy

The 8 GPU/model tools remain GPU-targeted and on-demand only. No idle GPU runtime is approved. GPU should start only for a later accepted worker/tool call and should stop after the job completes.

## Current Result

- Technical evidence candidate tools with provided evidence: `21`
- Private external-beta evidence candidate tools with provided evidence: `21`
- External-beta admission candidate tools with provided evidence: `21`
- Strict source-proof packet admission candidate tools with provided evidence: `21`
- External-beta-ready now: `0`
- Production-ready now: `0`

## No-Scope

No dependency install, package-lock mutation, tool execution, route execution, worker execution, provider/model call, browser/WebGL/canvas runtime, GPU runtime, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, beta unlock, or production unlock is approved by this packet.
