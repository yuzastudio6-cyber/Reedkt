# Activation Readiness State

Phase 40A records the Track A pro color/image approval workflow for
OpenColorIO, OpenImageIO, and Kornia. Phase 40B is the generated-fixture runtime
verification gate for those tools only and completed for `phase40b-20260531T10390`
after the dedicated CPU runtime image added `torch==2.7.1+cpu` for Kornia.
Phase 40C completed one bounded Track A real-video sample for
`phase40c-20260531T11504`, using only three 768x432 frames from the approved
Phase 32 private export and the Phase 40B QA evidence. Phase 40D completed the
private Track A pro color/image feature E2E readiness gate for
`phase40d-20260531T12493`, using only the approved Phase 32 source and Phase
40C QA evidence. Internal pro color/image feature testing is ready; Phase 45A
may start libass caption burn-in validation only.
Preferred base
`origin/codex/rp-activation-38e-film-private-feature-e2e-readiness` was
unavailable after fetch, so Phase 40A and Phase 40B are based on the completed
Track A Phase 38D/40A chain and document that fallback. Full-video pro
color/image, final delivery, provider calls, Revideo, production, external
beta, paid production, broad real media, arbitrary media, public delivery, and
Track B tools remain blocked.

Phase 38D completed the Track A controlled selected real-video FILM slow-motion
sample after Phase 38C verified generated-frame runtime and Phase 38B stored
the official Google Research `film_net/Style/saved_model` artifact tree
privately. The completed sample is limited to one approved Phase 32 segment
from `6.9835s` to `8.4835s`, 9 source frames at 512x288, and 17 preview frames
for `phase38d-20260531T00471`. Full-video interpolation, final delivery, audio
stretching, production, external beta, broad media, providers, Revideo, public
delivery, arbitrary media, and Track B tools remain blocked.

Phase 35F completed the private SAM2 feature E2E beta-readiness gate after
Phase 35E for `phase35f-20260530T02293`. It was limited to the approved Phase
32 controlled video chain, a structured approved plan snapshot, private SAM2
masks, private text-behind-subject preview frames, and QA. It marks SAM2 as
ready for internal SAM2 feature testing only. External beta, paid production,
broad real media, providers, Revideo, FILM, slow motion, Real-ESRGAN, final
export, arbitrary media, public delivery, and production remain blocked.

Phase 35E completed the controlled segment text-behind-subject preview gate for
`phase35e-20260530T01355`. It was locked to Phase 35D run
`phase35d-20260530T004442`, the 6.9s-8.9s segment, 10 bounded 768x432 frames,
Phase 35D SAM2 masks, and fixed text `REEDITPRO`. It created private preview
frames and metadata only. Full-video masks, full-video text-behind-subject,
final export, production launch, external beta, broad real user media, provider
execution, arbitrary media execution, FILM, slow motion, Real-ESRGAN, and
Revideo remain blocked.
FILM/slow-motion approval, artifact download, generated-frame runtime
verification, and one controlled selected real-video sample are complete
through Phase 38D, but real-video slow motion remains limited to the explicit
Phase 38D selected-segment gate.

Phase 35D completed the controlled SAM2 gate after Phase 35C for exactly one
approved Phase 32 private-export segment from 6.9s to 8.9s, 10 bounded frames
at 768x432, and a prompt derived from the Phase 33D mask. It produced private
mask/overlay/QA artifacts for `phase35d-20260530T004442` with no blocking QA
failures and warning-only temporal/human-review limitations.

Phase 35C completed SAM2 generated/synthetic runtime verification after Phase
35B. The dedicated staging SAM2 runtime loaded the private SAM2.1 tiny
checkpoint/config, verified checksums, and produced generated-fixture masks for
`phase35c-20260529T16082`.

Phase 34E completed the Real-ESRGAN broader-scope policy decision after the
Phase 34D bounded sample. It keeps full-frame enhancement, full-video
enhancement, blind full-video enhancement, production launch, external beta,
broad real user media testing, provider execution, arbitrary media execution,
FILM, slow motion, and Revideo blocked.

Phase 34D completed one bounded Real-ESRGAN enhancement sample from the approved
Phase 33D representative frame.

Phase 33E composed a private text-behind-subject PNG preview from the approved
Phase 33D frame, mask, and RGBA cutout. It emitted a text layer plan, depth
composition manifest, and QA with no blocking failures.

Phase 34A adds a static/report-only enhancement/slow-motion model approval
workflow. `RealESRGAN_x4plus` is staging-approved only for sample-first
enhancement planning. FILM is evaluated-only and execution/download-blocked.

Phase 34B added private GCS checksum evidence for the single approved
`RealESRGAN_x4plus.pth` file. Phase 34C verified the dedicated Real-ESRGAN L4
runtime on generated media only.

| Area | State | Notes |
| --- | --- | --- |
| Repo baseline | Ready | M0-M17 dry-run/static runtime foundation is present. |
| Smoke suite | Ready | Existing production smoke and summary scripts are available and cataloged by Phase 19. |
| Local baseline command/report | Ready | `activation:local-baseline` defaults to static-only reporting and requires confirmation before execution. |
| Container build reporting | Ready | Phase 20 can print build plans and parse human build logs without running Docker. |
| Staging container images | Built and pushed for completed activation phases | Non-GPU staging images and dedicated speech, BiRefNet, and Real-ESRGAN runtime images were built/pushed only for the approved activation scopes. Production images remain blocked. |
| Container readiness validation reporting | Ready | Phase 21 can print readiness command plans and parse human-run readiness logs without running Docker. |
| Container readiness run | Verified for completed activation paths | Completed activation phases include recorded staging readiness/runtime evidence. This does not approve arbitrary containers or production execution. |
| GCP staging setup planning | Ready | Phase 22 validates staging config, resource map, IAM, buckets, secrets, and command plans. |
| GCP staging resources | Created/verified for activation staging | Staging resources for `reeditpro` / `us-central1` exist for the completed controlled activation path. Production resources remain blocked. |
| Non-GPU image push/deploy | Completed where applicable | API/non-GPU jobs were built, pushed, and deployed for the completed staging activation phases. This is not production readiness. |
| Dedicated runtime jobs | Verified only for approved scopes | CPU speech runtime, BiRefNet L4 runtime, and Real-ESRGAN L4 runtime were verified in their controlled phases. General/broad GPU AI worker execution remains blocked unless a dedicated approved phase enables it. |
| Model approval workflow | Ready | Phase 26 can report evidence, storage policy, manifests, and text-only future download commands. |
| faster-whisper tiny model approval | Staging-approved for planning | `Systran/faster-whisper-tiny` is approved only for Phase 28 speech/caption planning. |
| Mask model approval workflow | Ready | Phase 33A can report BiRefNet/SAM2 evidence, storage policy, manifests, and text-only future download commands. |
| BiRefNet model approval | Staging-approved for planning | `ZhengPeng7/BiRefNet` is approved only for representative-frame/single-frame background-removal planning. |
| SAM2 model approval | Phase 35A review complete | Official SAM2.1 tiny source/license evidence is clear for staging download. Phase 35B is the approved download/load step for the tiny checkpoint/config only. |
| SAM2 model weights availability | Private staging storage verified | `sam2.1_hiera_tiny.pt` and `sam2.1_hiera_t.yaml` are stored under private generated-assets model storage with checksum/source evidence. Phase 35C may use them only for generated/synthetic runtime verification. |
| SAM2 runtime | Phase 35C generated-fixture verification complete | The dedicated SAM2 runtime ran on generated/synthetic frames only for `phase35c-20260529T16082`. |
| SAM2 real-video temporal mask | Phase 35D complete for one controlled short segment | `phase35d-20260530T004442` used the approved Phase 32 export, Phase 33D anchor evidence, and a 6.9s-8.9s bounded segment. Full-video masks remain blocked. |
| Segment text-behind-subject preview | Phase 35E complete for one controlled short segment | `phase35e-20260530T01355` used the Phase 35D short segment and private masks. It created private preview frames only; full-video text-behind-subject and final export remain blocked. |
| SAM2 feature E2E beta-readiness | Phase 35F complete for internal testing only | `phase35f-20260530T02293` used the approved controlled video chain, structured plan snapshot, 77-frame 768x432 private preview scope, private SAM2 masks, private preview frames, and QA. External beta and paid production remain blocked regardless of outcome. |
| Mask model weights availability | Private staging storage verified | `ZhengPeng7/BiRefNet` is stored under private generated-assets model storage with revision/checksum evidence. |
| Mask runtime | Verified for generated image and one controlled real-video frame | Phase 33C ran the generated-image L4 BiRefNet runtime job; Phase 33D ran BiRefNet on exactly one representative frame from `phase32-20260528T13330`. |
| Real-video representative-frame mask | Complete for one controlled test | Phase 33D produced a private frame, mask, RGBA cutout, metadata, and QA for `phase33d-20260528T161056` with no blocking failures. |
| Text-behind-subject frame preview | Complete for one controlled test | Phase 33E produced a private preview PNG, text layer plan, depth composition manifest, and QA for `phase33e-20260528T165755` with no blocking failures. |
| Enhancement model approval workflow | Ready | Phase 34A can report Real-ESRGAN/FILM evidence, storage policy, manifests, and text-only future download commands. |
| Real-ESRGAN model approval | Staging-approved for planning | `RealESRGAN_x4plus` is approved only for sample-first representative-frame or short-sample enhancement planning. |
| Real-ESRGAN weights availability | Private staging storage verified | Phase 34B downloaded only approved `RealESRGAN_x4plus.pth` into private staging storage and recorded checksum evidence. |
| FILM slow-motion approval | Phase 38A review complete | Official `google-research/frame-interpolation` source/license/checkpoint evidence is recorded. Staging planning approved Phase 38B download/load only. |
| FILM model weights availability | Private staging storage verified | Phase 38B downloaded only `film_net/Style/saved_model`, recorded aggregate checksum `6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b`, and uploaded 9 private GCS objects. |
| FILM runtime availability | Generated-frame runtime verified | Phase 38C execution `phase38c-20260530T23315` loaded the private Phase 38B model tree with TensorFlow 2.15.0, produced one private generated midpoint interpolation, and kept real-video slow motion, full-video interpolation, production, beta, providers, Revideo, and broad media blocked. |
| FILM real-video slow-motion sample | Complete for one controlled selected segment | Phase 38D execution `reeditpro-staging-film-runtime-job-pmxs7` for `phase38d-20260531T00471` processed one approved Phase 32 segment from 6.9835s to 8.4835s, 9 source frames at 512x288, 8 midpoint frames, 17 preview frames, and a private silent preview MP4. Full-video interpolation, audio stretch, final delivery, production, beta, providers, Revideo, Track B tools, and broad media remain blocked. |
| Pro color/image approval | Phase 40A review complete | Official OpenColorIO, OpenImageIO, and Kornia source/license evidence is recorded. Phase 40B generated-fixture runtime verification, Phase 40C bounded real-video sample, and Phase 40D private feature E2E readiness are complete; full-video pro color/image, final delivery, providers, Revideo, production, beta, and broad media remain blocked. |
| Pro color/image runtime | Phase 40D private feature E2E complete | Dedicated CPU runtime verified OpenColorIO `2.4.2`, OpenImageIO `3.0.18.1`, Torch `2.7.1+cpu`, and Kornia `0.8.1` on generated `256x256` fixtures for `phase40b-20260531T10390`, on three bounded 768x432 frames from the approved Phase 32 export for `phase40c-20260531T11504`, and through the private feature E2E gate for `phase40d-20260531T12493`. Internal pro color/image feature testing is ready; Phase 45A is ready only for libass caption burn-in validation. |
| Enhancement runtime | Verified for generated image | Phase 34C ran a dedicated L4 Real-ESRGAN runtime job on one generated synthetic image and emitted private enhancement QA with no blocking failures. |
| Real-video enhancement sample | Complete for one bounded controlled test | Phase 34D produced one private 512x512 sample crop and one 2048x2048 enhanced sample from `phase33d-20260528T161056`; full-frame and full-video enhancement remain blocked. |
| Real-ESRGAN broader-scope policy | Policy complete; broader execution blocked | Phase 34E records that human visual review is required and no full-frame/full-video/blind enhancement scope is allowed yet. Additional bounded sample planning may be considered only in a later approved phase. |
| Model weights availability | Private staging storage verified for approved activation models | `Systran/faster-whisper-tiny`, `ZhengPeng7/BiRefNet`, and `RealESRGAN_x4plus` have private staging storage and checksum/revision evidence for their approved controlled scopes. |
| CPU speech runtime | Verified for generated audio | Dedicated staging CPU speech runtime image loaded the approved tiny model from private GCS and ran faster-whisper on generated audio only. |
| First real video speech/caption | Complete for one controlled test | Phase 28 processed `/Users/macuser/Downloads/IMG_6005.MOV` for speech/caption only with private artifacts and no blocking caption QA findings. |
| Smart cut + captions | Complete for one controlled test | Phase 29 produced private SmartCutPlan, TimelineManifest, caption refs, and QA for `phase29-20260528T02254`; final export and broad real media testing remain blocked. |
| Final private export | Complete for one controlled private export | Phase 30 produced a private final export for the approved activation path. Public delivery remains blocked. |
| Internal beta | Blocked | Requires full private E2E evidence, operations, support, privacy, cost, and rollback readiness. |
| External beta | Blocked | Requires strict Phase 37 go/no-go approval. |
| Paid production | Blocked | Not approved by Phase 18 or the activation roadmap. |

Current classification:

- dry-run/static runtime foundation: ready
- local generated fixture testing: ready where supported
- local baseline command/report: ready
- container build reporting: ready
- staging container images: built and pushed for completed activation phases only; production images remain blocked
- container readiness validation reporting: ready
- container readiness/runtime evidence: recorded for completed activation paths only
- GCP staging setup planning: ready
- GCP staging resources: created/verified for `reeditpro` / `us-central1`
- staging deployment: complete where applicable for the controlled activation path
- dedicated runtime jobs: CPU speech runtime verified, BiRefNet L4 runtime verified, Real-ESRGAN L4 runtime verified, SAM2 L4 runtime verified on generated synthetic frames only
- model weights/licenses: staging approval remains scope-limited per model/tool
- model files/checksums: private staging storage verified for faster-whisper tiny, BiRefNet, and RealESRGAN_x4plus
- CPU speech runtime: verified on generated audio with local private-GCS model copy
- general/broad GPU AI worker execution: blocked unless a dedicated approved phase explicitly enables it
- controlled real-video chain: complete only for the explicit approved Phase 28-34D path
- broad real user media testing: blocked
- mask execution: complete only for the explicit Phase 33D representative-frame test; full-video masks remain blocked
- text-behind-subject execution: complete only for the explicit Phase 33E single-frame preview and Phase 35E controlled segment preview; full-video text-behind-subject remains blocked
- enhancement execution: blocked except the explicit Phase 34D bounded real-video-derived sample; full-frame and full-video enhancement remain blocked
- Real-ESRGAN broader-scope policy: Phase 34E complete; human visual review required before broader scope
- SAM2 model approval: Phase 35A review complete; official SAM2.1 tiny staging download approved for Phase 35B
- SAM2 model download/load: Phase 35B private storage evidence verified for `sam2.1_hiera_tiny`
- SAM2 execution: Phase 35C generated/synthetic runtime verification complete; Phase 35D controlled short real-video temporal mask test complete for one approved segment; Phase 35F private feature E2E gate complete for internal SAM2 feature testing only
- next Track A activation phase: Phase 45A libass caption burn-in validation only after Phase 40D private pro color/image feature E2E QA passed
- pro color/image approval/runtime: Phase 40A review complete; Phase 40B verified OpenColorIO, OpenImageIO, and Kornia on generated fixtures; Phase 40C verified the same Track A stack on three bounded approved real-video frames; Phase 40D verified the private feature E2E gate and does not approve full-video processing, final delivery, external beta, or paid production
- slow-motion execution: complete only for the explicit Phase 38D selected-segment gate; full-video interpolation, audio stretch, final delivery, production, beta, providers, Revideo, and broad media remain blocked
- provider execution: blocked
- production: blocked
- external beta: blocked
- paid production: blocked
