# AI Graphics Runtime Boundary Handoff Source Lockfile

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_handoff_review_passed_with_warnings`

- PR #715: open/draft/CLEAN at `9ff65730f9a88041e9f0d2f1b8f273711bef1a1e`; runtime-boundary canonicalization owner-approval QA accepted with warnings.
- PR #714: source owner approval accepted with warnings.
- PR #710: source owner review accepted with warnings.
- PR #709: source canonicalization QA accepted with warnings.
- PR #705: source canonicalization review accepted with warnings.
- PR #704/#700/#699/#696/#694: runtime-boundary owner-approval QA, owner approval, owner review, QA, and review evidence accepted with warnings.
- PR #692/#689/#688/#686/#685/#683/#681/#677/#674/#671: canonical agent-selection chain cited as compatible source context.
- PR #668/#665/#661/#657/#656/#651/#646/#645/#642/#638: canonical agent-routing chain cited as compatible source context.
- PR #623: product/agent-facing capability study and ranking matrix source cited.
- PR #621: CPU/static validation owner-review evidence for `d3`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, and `viz_js` cited.
- PR #425/#433/#441: package-proof merge evidence cited with merge SHAs `a055ef045db2a6ce127a044bee6219d5933532c3`, `dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0`, and `d174de59471eacf05bed5a5511d661f2e5ba9f0f`.
- PR #376/#361: historical AI graphics study/routing evidence cited.
- PR #542/#544: Track B and Track A exclusions cited as evidence-only context.

## Safety Boundary

- Agent selection may consume runtime-boundary metadata only for planning/study metadata.
- CPU/static validated tools remain not agent-executable.
- Browser chart runtime remains future-only.
- Animation runtime remains future-only.
- Browser/canvas/WebGL runtime remains future-only.
- Model CPU/GPU runtime remains future-only.
- Tool Route handoff remains future-only.
- Worker handoff remains future-only.
- Public artifacts and signed URLs remain future-only.
- Track B remains under TRACK_B_MEDIA_OSS_STEWARD as evidence-only exclusion context.
- Track A render/export exclusion via PR #544 remains evidence-only context.
- Internal owner labels are not product-facing capability names.
- No E2E proof, runtime readiness, internal beta, external beta, or production readiness is approved.
