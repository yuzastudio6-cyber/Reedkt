# Track All focus and reframe

Status: `internal_deterministic_execution_evidence`

Track All owns bounded simple tracked focus and the geometry of tracked
reframing. Final color design and final render remain owned by their respective
skills. This route grants no public delivery or production authority.

## Focus planning

The focus compiler consumes an exact Track Graph V2, checksum-bound box
sequences, caption reserved zones, and contiguous handoff ranges. It supports:

- subject sharp / background soft;
- subject normal / background dim;
- tracked spotlight and vignette;
- tracked magnification;
- foreground or background softening; and
- a simple subject outline.

Handoffs must cover the complete authorized range without gaps or overlaps and
may reference only exact graph tracks. A frame below the qualified confidence
floor widens to the full frame instead of retaining an aggressive target
effect. This internal deterministic proof uses checksum-bound track bounds;
production-quality mask isolation remains dependent on production-qualified
private mask artifacts and output QA.

## Reframe planning

The reframe compiler derives one normalized crop for every authorized frame.
It accounts for target union bounds, multiple subjects, headroom, lead room,
motion direction, caption reserved zones, output aspect ratio, smoothing, the
approved zoom ceiling, and low-confidence behavior. It supports `16:9`, `9:16`,
`1:1`, and `4:5` output planning.

No crop extends outside the source frame. Low confidence causes the route to
hold the last safe crop, widen the crop, or request manual review according to
the approved policy. Final rendering remains outside Track All; the result is a
content-addressed trajectory plus private integration evidence.

## Private Remotion boundary

`track_all_private_treatment_preview_v1` is a fixed private profile under
`tool.remotion.render_approved_composition.v1`. It accepts only:

- exact committed MP4 or Matroska source bytes and checksum;
- one supported focus or reframe mode;
- one canonical sample for every output frame;
- normalized crop geometry and anonymous priority track IDs;
- exact confidence, safe-zone, zoom, layer-order, and low-confidence policy;
- removed audio; and
- `privateOutput=true`, `publicArtifact=false`.

The profile accepts no caller command, module, path, URL, executable, renderer,
codec, destination, retry, fallback, model, GPU, or public-output selection.
Remotion renders the actual source bytes with the frame trajectory in its
networkless, read-only, non-root container. Captions remain above Track All.

## Independent QA

Integration QA binds the exact treatment trajectory, Remotion request,
committed source checksum, authorized frame count, output checksum, private
preview reference, three frame-golden artifacts, image identity, confinement,
and runtime attestation. A raw pass boolean is not an input. Cross-workspace
preview references, forged report content, wrong source/timing, public output,
or missing semantic evidence fail closed.

## Actual TRACK-12 evidence

`npm run test:track-all-focus-reframe` executed real Remotion `4.0.487`
renders for tracked magnification and speaker-follow `9:16` reframe, while also
compiling all eight focus modes and a two-target reframe:

- focus plan: `29014edf686e779878203ab00dd687dc141ded577de4abfe0ed6bddd5ebe5ee4`
- focus trajectory: `0b0c5d3dbdcc35734d04e871dc1ee3b798e67e2e927522b8dc797bd1a3f78def`
- focus private preview: `a530e013120b1ccde311f1aa13f703727c5735f7713045ec5b0db8ee2793dd1b`
- focus QA: `d2262491e21ea9a08a52c3a1aa48ca40720c9048399c06e6c39e8da2b94307cf`
- focus result: `147ec68b4671338f340fe41a2aa6371c1ffbe5c2630721dddbfb784b8bf9f41b`
- speaker reframe plan: `c63fcb24f98fd6a27155e3b23a6874cdc813dee8638e5ac13efd0536c270ed60`
- two-target reframe plan: `0ebb3859ab6bd31f5ac3dc15a87f77798f41bae55a3deaced83e86dd7e44b47e`
- reframe trajectory: `5b95f3c4eeee268dbf13472eced634426864587d5d186041ded430687b100bad`
- reframe private preview: `fb1fd43cbd56b3c846fdde4471146072a55d6aa394dea0368eec4953823fe7de`
- reframe QA: `138902554b953d4d240febaed857d622398adb75c6aab53fd4bd7462a5d9d5cf`
- reframe result: `b8906616dd2a5e30b2457cd75ad45d3ba79c0e79cf3cd83d7daa4b5a05777537`
- Remotion image identity:
  `41985bf7b61dc04d8622fb63da969e32b50bb835de3d05209bb15e665e618c56`

Six actual PNG frame-golden artifacts were validated across the two renders.
No public artifact, production mutation, provider/model request, GPU action, or
final export occurred.
