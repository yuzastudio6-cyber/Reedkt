# AI Graphics External-Beta Evidence Packet

Decision: `ai_graphics_external_beta_evidence_packet_prepared_with_runtime_blocks`

This packet is the future external-beta evidence surface for the 21 AI graphics tools. It is intentionally external-beta focused: instead of adding another internal review layer, it defines the sanitized evidence refs that a real beta launch gate would need before users can call the tools.

## Scope

- Tools covered: `21`
- Default evidence records provided: `0`
- Default evidence records accepted with provided evidence: `0`
- Full evidence records accepted with provided evidence: `21`
- External-beta-ready with provided evidence: `21`
- External-beta-ready now: `0`
- Production-ready now: `0`

## Required Evidence Classes

- Internal runtime soak evidence
- External-beta QA evidence
- Cost/concurrency/privacy/rollback evidence
- Incident-response evidence
- External-beta owner approval evidence

## Evidence Reference Policy

Accepted refs must be private/backend evidence identifiers, not user-public artifacts. Allowed namespaces are `private://`, `reeditpro-private://`, `backend-evidence://`, `owner-evidence://`, `external-beta-evidence://`, or sanitized backend evidence ids.

Rejected ref patterns include `http://`, `https://`, `signed-url://`, `public://`, and `gs://public`.

## Tools

`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`.

## Runtime Boundary

The packet can prepare an external-beta candidate set when every tool has all required private evidence refs. It does not make the tools callable now. Agent planning remains allowed, while agent/tool/route/worker/provider execution, browser/WebGL/canvas runtime, GPU/model runtime, model downloads, media processing, Supabase/GCS, public artifacts, signed URLs, internal beta, external beta, and production remain false.

## Next Evidence Step

Collect real private/backend evidence for internal runtime soak, external QA, cost/concurrency/privacy/rollback, incident response, and external-beta owner approval, then feed it through `ai-graphics:external-beta-evidence-packet:validate` and `ai-graphics:external-beta-readiness-gate` without committing private refs.
