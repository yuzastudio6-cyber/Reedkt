# Proven Tool Identity Catalog

ReEditPro uses `server/tool-execution/proven-tool-identity-catalog.ts` as the machine-readable authority for tool identity and verification state.

Every one of the 72 registry profiles has exactly one stable identity in the form `reeditpro.tool.<canonicalToolId>.v1`. Each record freezes the exact operation ID, operation-spec hash, package or binary name, pinned version when verified, runner class, private input/output contract, verified content types, evidence commands, proof gates, blockers, identity hash, and proof hash.

## Verification states

- `canonical_e2e_verified`: the exact tool has both an actual confined runner case and an exact canonical approved-snapshot lifecycle case covering reservation, lease, one-use dispatch, approved inputs, private persistence, actual QA, reconciliation, idempotent replay, and downstream lease verification.
- `confined_runner_verified`: the exact package and operation ran successfully in its confined runner, but that exact tool still lacks a canonical lifecycle case. This state must not be reported as end-to-end ready.
- `declared_not_runner_verified`: the tool has a bounded registry contract but lacks actual confined execution evidence.
- `intentionally_non_executable`: the entry is policy-, future-, license-, evaluation-, or planning-only and must not be dispatched.

Runner verification, canonical E2E verification, server-derived job-adapter verification, product readiness, external-beta readiness, and production readiness are separate claims. No lower state implies a higher one. `privateInternalJobAdapterReady` is true only when the exact tool also has a named canonical smoke key proving execution through the strict job-only adapter; a coordinator-only lifecycle does not imply that route-level proof.

## Commands

Run the catalog integrity and evidence-link smoke:

```bash
npm run smoke:proven-tool-identities
```

Print the complete JSON catalog:

```bash
npm run --silent report:proven-tools
```

The report includes all 72 records, not only successful tools. This prevents missing or blocked tools from disappearing from readiness accounting.

The authenticated backend inspection route also returns the summary and full catalog:

```text
POST /v1/edit-executions/tool-runtime-evidence/inspect
```

### Browser graphics identity package

| Canonical tool ID | Stable identity | Exact operation | Pinned package | Verified artifact |
| --- | --- | --- | --- | --- |
| `lottie` | `reeditpro.tool.lottie.v1` | `tool.lottie.render_lottie_motion.v1` | `lottie-web@5.13.0` | decoded non-flat `image/png`, 640x360 |
| `pixijs` | `reeditpro.tool.pixijs.v1` | `tool.pixijs.render_pixi_scene.v1` | `pixi.js@8.19.0` | decoded non-flat `image/png`, 640x360 |
| `konva` | `reeditpro.tool.konva.v1` | `tool.konva.render_canvas_overlay.v1` | `konva@10.3.0` | decoded non-flat `image/png`, 640x360 |
| `babylon_js` | `reeditpro.tool.babylon_js.v1` | `tool.babylon_js.render_babylon_scene.v1` | `@babylonjs/core@9.15.0` | decoded framebuffer `image/png`, 640x360 |
| `playwright` | `reeditpro.tool.playwright.v1` | `tool.playwright.capture_authorized_internal_page.v1` | `playwright@1.60.0` | authorized server-template `image/png`, 640x360 |

The common runner class is `offline_browser_graphics_execution_v1`; its evidence command is `npm run smoke:offline-browser-graphics-execution`. The canonical lifecycle evidence command is `npm run smoke:canonical-private-tool-dispatch`. Every catalog record also exposes its operation-spec hash, identity hash, proof hash, declared input/output kinds, gate booleans, blockers, and independent product/beta/production readiness flags.

### CPU-only AI capability identity package

| Canonical tool ID | Stable identity | Exact operation | Pinned package | Verified artifact |
| --- | --- | --- | --- | --- |
| `torch_torchvision` | `reeditpro.tool.torch_torchvision.v1` | `tool.torch_torchvision.verify_tensor_vision_runtime.v1` | `torch@2.13.0+cpu` + `torchvision@0.28.0+cpu` | deterministic runtime evidence JSON |
| `transformers` | `reeditpro.tool.transformers.v1` | `tool.transformers.verify_transformers_runtime.v1` | `transformers@5.13.0` | offline configuration evidence JSON; no model weights |
| `music21` | `reeditpro.tool.music21.v1` | `tool.music21.analyze_music_structure.v1` | `music21@10.5.0` | deterministic music-structure JSON from hash-bound WAV |
| `kornia` | `reeditpro.tool.kornia.v1` | `tool.kornia.refine_mask.v1` | `kornia@0.8.3` | deterministic 64x64 refined mask PNG |

The common runner class is `offline_ai_capability_execution_v1`; its evidence command is `npm run smoke:offline-ai-capability-execution`. The hash-locked runtime executes with no network, a read-only root filesystem, a non-root user, dropped capabilities, no new privileges, bounded CPU/memory/process limits, exact structured payloads, and checksum-protected authority and attestation records. `music21` and `kornia` additionally pass the canonical edit lifecycle in `npm run smoke:canonical-private-tool-dispatch`. Torch/Torchvision and Transformers remain runtime-readiness probes and are deliberately not misrepresented as approved edit-work operations.

### Native color and render-pipeline identity package

| Canonical tool ID | Stable identity | Exact operation | Pinned package | Verified artifact |
| --- | --- | --- | --- | --- |
| `opencolorio` | `reeditpro.tool.opencolorio.v1` | `tool.opencolorio.apply_color_transform.v1` | `opencolorio-tools@2.1.2+dfsg1-4+b3` | deterministic reviewed-LUT 64x64 PNG |
| `openimageio` | `reeditpro.tool.openimageio.v1` | `tool.openimageio.process_image_sequence.v1` | `openimageio-tools@2.4.7.1+dfsg-2` | deterministic two-frame processing proof and 64x64 PNG |
| `streamer_render_pipeline_support` | `reeditpro.tool.streamer_render_pipeline_support.v1` | `tool.streamer_render_pipeline_support.verify_render_pipeline_support.v1` | GStreamer tools/base `1.22.0` Debian revisions | deterministic audio/video pipeline evidence JSON |

The common runner class is `offline_native_image_pipeline_execution_v1`; its evidence command is `npm run smoke:offline-native-image-pipeline-execution`. The image uses Debian snapshot `20260623T000000Z`, exact direct package revisions, fixed server-owned fixtures, no caller paths/LUTs/pipelines, checksum-protected authority, zero-network execution, read-only non-root confinement, and deterministic replay. OpenColorIO and OpenImageIO additionally pass the canonical approved-edit lifecycle in `npm run smoke:canonical-private-tool-dispatch`. GStreamer remains a readiness probe. Dependency, security, license, plugin/build closure, arbitrary user-source, deployment, and product promotion remain separately gated.

### Native audio processing identity package

| Canonical tool ID | Stable identity | Exact operation | Pinned package/source | Verified artifact |
| --- | --- | --- | --- | --- |
| `rnnoise` | `reeditpro.tool.rnnoise.v1` | `tool.rnnoise.denoise_voice.v1` | RNNoise `v0.2`, official Xiph build-fix commit `372f7b4b76cde4ca1ec4605353dd17898a99de38`, model `0b50c45` | deterministic 48 kHz mono PCM WAV with measured noise reduction, voice-energy preservation, and explicit 480-frame algorithmic latency |
| `signalsmith_stretch` | `reeditpro.tool.signalsmith_stretch.v1` | `tool.signalsmith_stretch.stretch_approved_music_asset.v1` | Signalsmith Stretch `1.1.0` plus hash-locked ReEditPro fixed-seed adapter | deterministic 48 kHz mono PCM WAV, exactly 60,000 frames at the approved 1.25x time ratio |

The common runner class is `offline_native_audio_processing_execution_v1`; its evidence command is `npm run smoke:offline-native-audio-processing-execution`. Source archives, the RNNoise model, the official post-release build fix, and the Signalsmith adapter are SHA-256 pinned. Execution rejects caller paths, URLs, commands, arbitrary ratios, arbitrary pitch shifts, and extra fields; it runs with zero network, a read-only root filesystem, a non-root user, dropped capabilities, no new privileges, and bounded CPU, memory, processes, and temporary storage. Both tools pass the canonical approved-edit lifecycle in `npm run smoke:canonical-private-tool-dispatch`, including funded reservation, one-use dispatch, lease fencing, private WAV persistence, semantic audio QA, reconciliation, exact replay, and downstream lease-time byte verification. Arbitrary user-audio ingestion and segmentation, distributed workers, production dependency/security/license review, deployment, and product promotion remain separately gated.

### Container packaging validation identity package

| Canonical tool ID | Stable identity | Exact operation | Pinned package/source | Verified artifact |
| --- | --- | --- | --- | --- |
| `mkvtoolnix_container_validation` | `reeditpro.tool.mkvtoolnix_container_validation.v1` | `tool.mkvtoolnix_container_validation.validate_mkv_container.v1` | Debian snapshot `mkvtoolnix@74.0.0-1` | deterministic JSON proving an actual MKV package was written and re-identified with video, audio, and subtitle tracks |
| `gpac_mp4box_packaging_validation` | `reeditpro.tool.gpac_mp4box_packaging_validation.v1` | `tool.gpac_mp4box_packaging_validation.validate_mp4_package.v1` | GPAC `v26.02.0`, source SHA-256 `7a265e1cd58b317d8c9175816a54e0ab14199c21d81eb779047d7088fca52ae4` | deterministic JSON proving an actual MP4 package was written and re-inspected with video, audio, and text tracks |

The common runner class is `offline_container_packaging_validation_execution_v1`; its evidence command is `npm run smoke:offline-container-packaging-validation-execution`. GPAC is source-built with networking disabled and only the local ISO-media/file-input/text-input/MP4-mux filter closure enabled. Both exact operations reject caller paths, URLs, commands, arbitrary packaging settings, and extra fields, and use approved server-owned deterministic fixtures under zero-network, read-only, non-root confinement. Both pass the canonical approved-edit lifecycle in `npm run smoke:canonical-private-tool-dispatch`, including reservation, lease fence, one-use dispatch, create-only private JSON persistence, semantic track QA, reconciliation, replay, and downstream lease-time object verification. Arbitrary user-media packaging, public delivery, distributed workers, production dependency/security/license review, deployment, and product promotion remain separately gated.

### VapourSynth frame-pipeline identity package

| Canonical tool ID | Stable identity | Exact operation | Pinned package | Verified artifact |
| --- | --- | --- | --- | --- |
| `vapoursynth` | `reeditpro.tool.vapoursynth.v1` | `tool.vapoursynth.process_approved_frame_pipeline.v1` | official `vapoursynth@77` ARM64 manylinux wheel, SHA-256 `ab977973bf93e007778f383507ad6c2eae6526a90c2c18cdb41c11b33b794148` | deterministic JSON proving a 24-frame built-in `BlankClip → CropRel → Point` pipeline and identical first/last RGB plane hashes |

The runner class is `offline_vapoursynth_frame_pipeline_execution_v1`; its evidence command is `npm run smoke:offline-vapoursynth-frame-pipeline-execution`. The exact operation allows only the reviewed built-in `std` and `resize` namespaces over a server-owned fixture. Caller scripts, paths, URLs, source bytes, and third-party plugins are rejected. It passes the canonical approved-edit lifecycle in `npm run smoke:canonical-private-tool-dispatch`, including reservation, one-use dispatch, lease fencing, create-only private JSON persistence, semantic frame QA, reconciliation, replay, and downstream lease-time object verification. The current proven image is ARM64-only; x86_64 parity, arbitrary approved source-media processing, plugin review, distributed workers, deployment, and product promotion remain separate gates.

### AudioFlux analysis identity package

| Canonical tool ID | Stable identity | Exact operation | Pinned package/source | Verified artifact |
| --- | --- | --- | --- | --- |
| `audioflux` | `reeditpro.tool.audioflux.v1` | `tool.audioflux.analyze_beat_and_energy.v1` | official AudioFlux `v0.1.9` source, SHA-256 `538c2b5ff718c88b8c457b10f4b8fc03796680e43daf4afc2e95d717d01d281b` | deterministic JSON from actual `BFT`, spectral-flux, spectral-energy, and temporal-energy execution |

The runner class is `offline_audioflux_analysis_execution_v1`; its evidence command is `npm run smoke:offline-audioflux-analysis-execution`. The official source is compiled with pinned Clang/OpenMP packages because the published `py3-none-any` Linux wheel contains an x86-64-only native library. The proven image is ARM64-only and executes an approved server-owned deterministic audio fixture with zero network, a read-only root filesystem, non-root identity, dropped capabilities, bounded resources, exact request fields, checksum-protected authority, and attestation records. Arbitrary caller audio remains rejected. AudioFlux also passes the canonical approved-snapshot lifecycle in `npm run smoke:canonical-private-tool-dispatch`, covering funded reservation, lease fence, one-use dispatch, create-only private JSON persistence, semantic BFT/flux/energy QA, reconciliation, exact replay, and downstream lease-time byte verification.

### rembg background-removal identity package

| Canonical tool ID | Stable identity | Exact operation | Pinned package/model | Verified artifact |
| --- | --- | --- | --- | --- |
| `rembg` | `reeditpro.tool.rembg.v1` | `tool.rembg.remove_image_background.v1` | rembg `2.0.76`, ONNX Runtime `1.27.0`, U2NetP SHA-256 `309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8` | deterministic 128×128 RGBA PNG, SHA-256 `668366803056dc51a75cafc5ad2be9363146fa22a1ed5cba481815944759fd45` |

The runner class is `offline_rembg_background_removal_execution_v1`; its evidence command is `npm run smoke:offline-rembg-background-removal-execution`. The runtime preloads the exact U2NetP checkpoint, disables runtime model downloads, accepts no caller path, URL, bytes, model, command, or environment, and runs CPU-only under zero-network, read-only, non-root confinement with bounded resources. The canonical lifecycle evidence command is `npm run smoke:canonical-private-tool-dispatch`, which proves approved-snapshot and work-item binding, funded reservation, lease fencing, one-use dispatch, private create-only PNG persistence, semantic alpha-separation QA, reconciliation, exact replay, and downstream lease-time byte verification. Arbitrary approved user-image ingestion, x86_64 parity, distributed workers, production dependency/security/license review, deployment, external beta, and product promotion remain separate gates.

### DeepFilterNet voice-cleanup identity package

| Canonical tool ID | Stable identity | Exact operation | Pinned package/model | Verified artifact |
| --- | --- | --- | --- | --- |
| `deepfilternet` | `reeditpro.tool.deepfilternet.v1` | `tool.deepfilternet.enhance_voice.v1` | DeepFilterNet/DeepFilterLib `0.5.6`, Torch/Torchaudio `2.2.2`, DeepFilterNet3 checkpoint SHA-256 `23b92884f63ccf54bb026014604625ab231657b6480df65db4095c4c171e6003` | deterministic mono 48 kHz PCM WAV, SHA-256 `a359cf256f9f05294ee7f9701ec189385aed277020b2be5dfa83d229409e27a7` |

The runner class is `offline_deepfilternet_voice_cleanup_execution_v1`; its evidence command is `npm run smoke:offline-deepfilternet-voice-cleanup-execution`. The hash-locked ARM64 image embeds the exact DeepFilterNet3 archive/config/checkpoint and a pinned eSpeak-generated server fixture during its controlled build, then permits no runtime download. The exact request fixes a gentle 12 dB attenuation ceiling, disables the post-filter, accepts no caller audio, paths, models, commands, arguments, or environment, and executes CPU-only with zero network, a read-only root filesystem, no mounts, a non-root user, dropped capabilities, bounded resources, checksum-protected authority, and attestations. Two independent runs produce byte-identical output and improve the approved noisy fixture from 3.217773 dB to 8.214627 dB SNR. The canonical evidence command is `npm run smoke:canonical-private-tool-dispatch`; it proves approved-snapshot/work-item binding, funded reservation, lease fencing, one-use dispatch, create-only private WAV persistence, semantic voice/noise QA, reconciliation, exact replay, downstream byte verification, and create-only attempt-level internal production-cost evidence. That cost record uses integer micros and rate card `rp-ratecard-01-mock-safe`, remains provisional/private-local, and contains no customer price, customer credit, service fee, wallet, settlement, or charging fields. Arbitrary approved user-audio ingestion, x86_64 parity, distributed workers, durable database cost reconciliation, production dependency/security/license review, deployment, external beta, public delivery, and product promotion remain separate gates.

## Current evidence snapshot

Evidence revision `2026-07-12.23` records:

- 72 total registry profiles with stable identities.
- 61 callable candidates.
- 11 intentionally non-executable profiles.
- 53 confined-runner verified tools.
- 50 exact canonical end-to-end verified tools.
- 21 exact tool identities verified through the server-derived canonical job adapter.
- 8 callable candidates that remain declared but do not yet have confined-runner proof.
- 0 product-, external-beta-, or production-ready tools; those promotions require separate deployment evidence.

The remaining 11 callable candidates that have not reached canonical E2E stay visible in the same report. Their blocker lists identify the exact missing proof class per tool, including reviewed model/checkpoint manifests and offline caches for model-backed tools and exact fixture/artifact QA for other package-backed tools. A candidate is never promoted from declaration or import availability alone.

The 50 exact canonical end-to-end identities are:

```text
d3, echarts, vega_lite, vega, satori, svg_js, viz_js, lottie, animejs, three_js,
pixijs, konva, babylon_js, rembg, kornia, librosa, audioread, pydub, scipy, resampy,
pyloudnorm, audioflux, music21, pretty_midi, mido, noisereduce, pedalboard, mir_eval,
pydub_effects, ebu_r128_pyloudnorm, rnnoise, deepfilternet, playwright, pyscenedetect,
opencolorio, openimageio, mkvtoolnix_container_validation,
gpac_mp4box_packaging_validation, ffmpeg, ffprobe, pyav, opentimelineio, remotion, libass,
sharp, duckdb, polars, opencv, signalsmith_stretch, vapoursynth
```

The 21 server-derived job-adapter verified tool identities are:

```text
echarts, vega_lite, vega, satori, svg_js, viz_js, lottie, animejs, three_js, pixijs,
konva, babylon_js, kornia, music21, rnnoise, playwright, opencolorio, openimageio,
ffprobe, remotion, signalsmith_stretch
```

`confinedRunnerVerifiedCount` includes tools that have also reached canonical E2E; it is not a count of runner-only tools. At this revision the three runner-only identities are `torch_torchvision`, `transformers`, and `streamer_render_pipeline_support`; all three are readiness probes. DeepFilterNet, AudioFlux, rembg, OpenColorIO, OpenImageIO, RNNoise, Signalsmith Stretch, MKVToolNix, and GPAC/MP4Box now have canonical lifecycle proofs using approved server-owned deterministic fixtures. All tools still require arbitrary user-source, dependency/security/license review, distributed-worker, deployment, and product-promotion evidence. Public delivery, settlement, billing, external beta, and production rendering remain separate blocked gates.

## Promotion rule

A tool may move to `canonical_e2e_verified` only when all twelve proof gates are true and its named canonical evidence key exists in `smoke:canonical-private-tool-dispatch`. It may additionally set `privateInternalJobAdapterReady` only when that exact identity has a separate named adapter evidence key in the same executed smoke. Adding a package, declaring an operation, passing an import probe, sharing a coordinator, or merely appearing in the adapter dispatch table is not sufficient.

The catalog remains private-internal evidence. Distributed workers, deployed service identities, production object storage, observability, incident response, external beta, public delivery, and production promotion remain separate gates.
