# Track All privacy redaction

Status: `internal_deterministic_execution_evidence`

This route is a private, range-bounded Track All treatment. It does not grant
production execution, public delivery, final export, or a privacy-QA override.

## Exact execution boundary

The server compiles `approved_track_all_privacy_redaction_matroska_v1` onto
`tool.ffmpeg.execute_approved_media_recipe.v1`. The request accepts only:

- an exact source checksum and FFprobe-derived dimensions;
- the approved assignment range and frame rate;
- one fixed treatment enum;
- canonically ordered integer mask regions with exact frame spans; and
- fixed private-output, fail-closed, codec, and metadata policy values.

It accepts no caller filter graph, executable, command, path, URL, codec,
color, model, GPU, destination, retry, fallback, or public-output flag.

The approved treatments are Gaussian blur, pixelation, mosaic, and solid
fill. `conservative_region_cover` compiles to solid fill. Tracked crop
exclusion is deliberately rejected here and belongs to the separately
authorized tracked-reframe route.

The confined implementation uses the forward-only local image
`reeditpro/ffmpeg-lgpl-internal:8.1.2-track-privacy-v10-local`. It preserves
the reviewed FFmpeg `8.1.2` source hash, LGPL-only configuration, file/pipe
protocols, network-none execution, read-only root, numeric non-root user,
fixed server arguments, component allowlists, cgroup evidence, and
`productReady=false`. The only filters added over the prior image authority
are the core `color`, `drawbox`, `gblur`, and `maskedmerge` primitives needed
by this fixed recipe.

## Conservative uncertainty behavior

The compiler consumes the exact Track Graph V2 and checksum-bound box
sequences. It independently checks tenant, project, assignment, plan,
manifest, source, timing, range, privacy policy, private-mask, and graph
lineage.

For each target frame:

- reliable active/reacquired geometry receives a dilated redaction region;
- partial occlusion receives stronger dilation;
- missing, low-confidence, fully occluded, lost, or identity-uncertain
  geometry receives a full-frame conservative uncertainty cover;
- grounded reflection regions receive their own explicit coverage; and
- no region may extend outside the authorized output range.

If any uncertainty cover is required, the effective recipe is promoted to
solid fill. Confidence loss therefore cannot reveal the target. The output
remains blocked for manual/repair review unless independent flattened-preview
QA passes.

## Independent flattened-preview QA

`track_all_privacy_pixel_inspection_evidence_v1` is derived from exact decoded
source and output RGB frames, not from a caller pass boolean. It measures:

- every expected privacy frame and uncertainty window covered;
- reflection coverage when required;
- masked mean absolute pixel change;
- masked high-frequency energy reduction;
- near-black coverage for solid fills; and
- an outside-mask diagnostic delta.

The content-addressed inspection is bound to the exact source and private
preview checksums. A forged inspection, unchanged preview, missing frame,
uncovered lost span, missing required reflection, insufficient effect, wrong
tenant, wrong source, or public output fails closed. Only a passing report can
produce `tracked_redaction_result_v1`, whose media is private and whose
`noSensitiveExposure` assertion is bound to that exact QA receipt.

## Actual TRACK-11 evidence

The real synthetic-video fixture executed FFmpeg and FFprobe `8.1.1` on the
host for all four treatments and executed solid-fill redaction through the
confined FFmpeg `8.1.2` runtime. It generated no public artifact and performed
no production mutation.

- source checksum:
  `fd93d9dc79517480c93e22425931e6c921feb29849f3a2cf47509db2dfcb2337`
- source-truth hash:
  `f44cd16e3a4c4045e6c514f91159595290bacd20f8336989f639a29242ebd8ac`
- reliable Track Graph hash:
  `25e3724eba49f6a2bf459eb0f3ff3238bae7972300b89bc21df220eba3ba2496`
- conservative Track Graph hash:
  `4e14c8e9f43d3f6cc49331dabdc2f448ba8581b04348f3f94edd1d216234a7a9`
- conservative recipe hash:
  `18feccecc2a019040160e9d1d405e214a0099872bd344193b94f1f9a9a9ef82f`
- conservative flattened-preview inspection hash:
  `268949464cf397dc0ebd99d61268448fc485810336a0fb77da741c19b1574bcc`
- conservative privacy-QA hash:
  `7f48255c1551f2d7b659a1cbf1b54d9ce7a36af9f09228780bc8921f8e05596c`
- conservative result hash:
  `d9bf9abb72719bf31dced117d7602ff08c98bf416cd0e0190ba7431d46f59f4e`
- confined runtime image identity:
  `6711a15ed2e9a81937aa6cad53667d0887bf7839fa31c5e6fdb25f8b73dd0149`
- confined runtime attempt evidence:
  `59c24bf52438d978d0399f69ca57936adf4d77e5d4736be97e076c89f089c3c0`

The local image build produced OCI image ID
`sha256:838af9025e941b7d6b936e0cf7820b579e752bfc983c9479bf67bf201ff2d2c6`
and passed exact component allowlists plus the new masked-redaction runtime
probe.

This evidence qualifies the deterministic private privacy fixture path only.
It is not real SAM 3.1 inference, real-world privacy coverage, production
worker/store evidence, security release approval, or public delivery
authority.
