# AI_TOOLS_CREATIVE_GRAPHICS Routing Policy

## Route Selection

Choose no AI Tools graphics route when a clean edit, caption, simple text card, or existing source footage communicates the beat more clearly.

Use `remotion` planning when the visual needs deterministic composition, title cards, lower thirds, callouts, social video cards, caption-safe overlays, panel motion, timing, or final-layout handoff metadata. Remotion is a future compositor path; it does not run or export in this phase.

Use `d3` planning when custom diagrams, timelines, money flows, evidence flows, exact arrows, or network relationships require precise geometry and labels.

Use `echarts` planning when standard charts, dashboard visuals, business metrics, finance cards, or repeatable chart cards are enough.

Use `vega` or `vega_lite` planning when a declarative chart spec is useful for repeatable structured chart handoff or provider-reviewable JSON. Do not use these as launch default execution paths.

Use `satori` plus `resvg_js` planning only for a future card-to-SVG and SVG-to-image path after sanitizer, font, native dependency, and rasterization approvals.

Use `svg_js` planning for controlled SVG shapes, arrows, labels, badges, and vector layer specs when exact scalable output matters.

Use `lottie_web` planning for reusable vector animation overlays, icons, status motion, and brand-safe transparent motion with provenance review.

Use `anime_js` planning for reusable easing, reveal, and UI-style motion preset specs, not for runtime DOM execution.

Use `pixijs` planning for future high-performance 2D canvas effects, sprites, particles, or playful social overlays only when they support meaning.

Use `three_js` planning for future 3D product mockups, abstract visual explainers, 3D icons, and camera scenes only when 3D materially improves the edit.

Use `viz_js` or `graphviz` planning for future DOT graph layout of process, organization, dependency, or relationship diagrams.

Hand off to `TRACK_A_RENDER_EXPORT` only after approved manifests, source refs, checksums, QA gates, and owner review exist. Track A owns future final composition/export; AI_TOOLS_CREATIVE_GRAPHICS owns capability routing and graphics evidence contracts.

Hand off to `PROVIDER_GATEWAY_MODELS` or DeepSeek only for coding/spec proposals, schema suggestions, or implementation findings. Provider outputs must not execute code, install packages, call tools, render graphics, create public artifacts, or handle secrets.

## Source-Of-Truth Policy

Source-of-truth evidence:

- structured chart, diagram, card, motion, SVG, 3D scene, graph, and render manifests;
- approved source data refs and source confidence records;
- checksum plans for future private artifacts;
- QA reports for readability, source confidence, safe zones, alpha, motion restraint, and artifact policy.

Review artifacts only:

- screenshots;
- previews;
- local mock cards;
- visual examples;
- dry-run fixture summaries.

Not source-of-truth:

- signed URLs;
- public artifacts;
- raw prompts;
- raw provider/model responses;
- generated code snippets;
- temporary render outputs;
- unreviewed SVG, DOT, HTML, CSS, canvas, or WebGL payloads.

## Fail-Closed Policy

Routing must fail closed when a request requires final render/export, direct worker execution, direct provider/model calls, unreviewed generated code execution, unapproved package install, public artifact creation, signed URLs as source-of-truth, raw prompt execution, production unlock, external beta unlock, or any graphics/runtime path not separately approved.
