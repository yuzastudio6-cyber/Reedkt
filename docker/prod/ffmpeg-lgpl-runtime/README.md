# ReEditPro FFmpeg LGPL Internal Runtime Foundation

Status: `internal_build_candidate_product_ready_false`

This isolated image is a source-built FFmpeg/ffprobe foundation for bounded,
private ReEditPro worker evaluation. Its revisioned local tag and runtime
authority namespace are used by the exact canonical private trim, voice,
professional-color, dependency-QA, and Remotion-input paths. It is not wired
to GCP, Supabase, providers, billing, public delivery, or production export.

## Locked inputs

- FFmpeg `8.1.2`, fetched from the official FFmpeg release URL.
- Source SHA-256:
  `464beb5e7bf0c311e68b45ae2f04e9cc2af88851abb4082231742a74d97b524c`.
- Official detached-signature SHA-256:
  `0a0963fccd70597838073f3e31b20f4a4d8cc2b5e577472c9a5a1f22624246f8`.
- Official release-key fingerprint:
  `FCF986EA15E6E293A5644F10B4322F04D67658D8`.
- Debian Bookworm slim multi-platform index digest:
  `sha256:60eac759739651111db372c07be67863818726f754804b8707c90979bda511df`.
- Debian package resolution snapshot: `20260623T000000Z`.
- `SOURCE_DATE_EPOCH=1781664539`, matching the release signature time.

The source checksum is enforced twice: BuildKit `ADD --checksum` and an
in-stage `sha256sum --check --strict`. The checked-in provenance lock records
the source, detached signature, signing key, base image, snapshot, and toolchain
versions. The initial detached signature was verified locally against the exact
fingerprint above. Builds do not fetch mutable Git branches or tags.

## Deliberately narrow capability boundary

The configure lock explicitly disables GPL, nonfree, version3, network,
autodetection, and every component before enabling a reviewed subset.

Runtime protocols are exactly `file` and `pipe`. Input support is limited to
common local/private media demuxing and decoding for analysis. Intermediate
outputs are limited to Matroska/NUT/rawvideo, FFV1/lossless VP9/raw/PPM video,
FLAC/PCM audio, hashes, null analysis, and image sequences. The VP9 encoder is
the pinned Debian `libvpx 1.12.0-1+deb12u5` build used only for the bounded,
Remotion-decodable professional color intermediate. The exact allowlist also
contains the bounded `colorchannelmixer`, `colorlevels`, `unsharp`, and
`setparams` filters required by the private professional source-color recipe,
the core `color`, `drawbox`, `gblur`, and `maskedmerge` filters required by
the server-compiled Track All privacy-mask recipe, and `tpad` for the exact
bounded last-picture hold needed when an approved
container timeline extends a few frames beyond its encoded video stream;
caller-authored filter strings remain forbidden.

The image does **not** compile H.264, HEVC, `libx264`, `libx265`, or OpenH264
encoders. Its native AAC encoder is compiled only for the fixed private
source-slice finalizer. That finalizer stream-copies the already approved H.264
chunk video and encodes exactly one server-verified audio authority: either the
approved source stream for untouched-audio edits or the exact picture-locked
professional voice-delivery PCM WAVE for voice-processed edits. It never
concatenates independently encoded chunk audio. The exact `s16le` raw PCM
demuxer is enabled only so the fixed finalizer can strip and verify the
server-produced WAVE container before the one approved AAC encode. Its MP4/MOV
muxer is restricted
to that finalizer and the first-object-chunk runner's temporary source-slice
extraction. The
first-object-chunk runner does not encode H.264 or AAC: it stream-copies exact,
compatible H.264 MP4 slices into a video-only Matroska object chunk. These
recipes are server-owned and caller-authored FFmpeg commands remain forbidden.
Consequently the image is not a final-delivery image and cannot satisfy the
H.264/MP4 export plan. H.264/HEVC/AAC decoding remains included only for
internal private processing and is still blocked from a production-readiness
claim pending codec patent, commercial-use, distribution, and legal policy
review.

The first-object-chunk recipe is deliberately narrower than general editing:
it accepts two to eight exact MP4 source commitments and two to sixteen
approved, contiguous, frame-zero H.264 slices at 30 fps. Sources must share
the exact codec extradata, frame, time-base, BT.709 color, and no-B-frame
profile. It creates only the first 4K object chunk and excludes program audio,
which remains a separate downstream work item. This is not evidence for
arbitrary camera codecs, HDR, VFR, non-zero source trims, or a complete
long-form edit.

FFmpeg's LGPL configure result is important evidence, but it is not legal
approval for FFmpeg, every enabled codec, the base distribution, or commercial
delivery.

## Runtime confinement

The image declares numeric user `65532:65532`. The ordinary standalone smoke
runs with:

```bash
--network=none
--read-only
--cap-drop=ALL
--security-opt=no-new-privileges:true
--pids-limit=128
--memory=2g
--memory-swap=2g
--cpus=2
--tmpfs /tmp:rw,noexec,nosuid,nodev,size=64m,mode=1777
```

The two fixed large-media entrypoints use the same confinement controls with a
4 GiB memory limit and a 1,342,177,280-byte `/tmp` tmpfs. Those larger bounds
are fixed by the runtime and independently attested; they are not caller
options.

The generic FFmpeg/FFprobe path may replace the logical binary entrypoint with
the fixed
`/usr/local/bin/reeditpro-media-cgroup-resource-observer` wrapper. The wrapper
accepts only a server-generated nonce, one allowlisted in-image entrypoint, and
server-derived arguments. It preserves streamed stdin, records cgroup-v2 CPU
and memory counters before and after the child, forwards termination, preserves
the child exit code, and emits one nonce-bound terminal marker. The server
requires and strips that marker before applying the ordinary zero-diagnostic
success policy. Specialized long-form entrypoints are allowlisted for future
shared integration but are not automatically observed by the current runtime.

Dockerfiles cannot enforce `--network=none` or `--read-only` by themselves.
Any future worker launcher must enforce those controls plus private read-only
input mounts, an isolated bounded output mount, approved snapshot/work-item/
credit/lease lineage, idempotency, output verification, and atomic promotion.
The verifier fails when it sees an IPv4 route, a non-loopback IPv6 route, or a
writable root filesystem. Docker Desktop may expose inert LinuxKit tunnel
template interfaces even in a network-none namespace, so route state is the
portable check used here.

## Build and smoke

From the repository root:

```bash
docker/prod/ffmpeg-lgpl-runtime/smoke.sh --build
```

The build wrapper removes AppleDouble `._*` sidecars only from this isolated
build-context directory before invoking Docker. This avoids a Docker Desktop
xattr failure seen on backup/APFS volumes; it does not touch product sources.

The image smoke checks the immutable configuration, LGPL banner, exact encoder,
decoder, filter, demuxer, muxer, protocol, and bitstream-filter allowlists,
non-root identity, read-only root, network-none runtime, all runtime evidence
hashes, synthetic FFV1+PCM intermediate creation, ffprobe JSON, frame
extraction, the bounded BT.709 lossless-VP9 professional color chain, and deterministic
video/audio analysis filters.

It processes synthetic media only. The dedicated object-chunk smoke also proves
same-input byte-for-byte deterministic reexecution plus independent ffprobe QA:

```bash
npm run smoke:offline-media-binary-object-chunk
```

That smoke uses synthetic constant-color 4K inputs. It does not prove
multi-camera editorial quality, representative raw-footage scale, cloud
throughput, broad codec support, remaining chunk execution proof, final rendering,
or export. Neither smoke reads user artifacts or unlocks workers, routes,
previews, public delivery, or production export.

The private long-form master contract and real-media smokes prove the bounded
2-to-124 chunk, six-hour-capacity assembly surface and one actual two-chunk UHD
master. Video chunks and continuous program audio enter through independent,
checksum-verified, fixed-command streams so FFmpeg demuxer pacing cannot
deadlock the other input. The output is one private Matroska VP9/FLAC master;
both streams are copied without re-encoding and independently probed through
all exact video frames:

```bash
npm run smoke:offline-media-binary-long-form-master-contract
npm run smoke:offline-media-binary-long-form-master
```

This is runner evidence, not canonical queue/lease/one-use dispatch, retained
six-hour execution, final-master QA, Google Cloud, public export, or production
readiness.

## SBOM and digest evidence

For a locally built image:

```bash
docker image inspect --format '{{.Id}}' reeditpro/ffmpeg-lgpl-internal:8.1.2-track-privacy-v10-local
docker sbom --format spdx-json reeditpro/ffmpeg-lgpl-internal:8.1.2-track-privacy-v10-local > /tmp/reeditpro-ffmpeg-8.1.2-track-privacy-v10.spdx.json
sha256sum /tmp/reeditpro-ffmpeg-8.1.2-track-privacy-v10.spdx.json
```

The builder package lock and runtime binary/config hashes are stored under
`/opt/reeditpro-ffmpeg/share/reeditpro/` in the image.

An independent local arm64 `--no-cache` rebuild produced byte-identical
FFmpeg, ffprobe, configuration, package-lock, allowlist, license, provenance,
runtime layer, OCI platform manifest, and OCI config digests, and both images
passed the confined smoke. BuildKit's local provenance-attestation manifest
was intentionally fresh, so the outer attestation-bearing OCI index digest was
different. Deterministic signed registry attestations remain a release blocker;
the executable arm64 image itself was byte-for-byte reproducible.

## Remaining release blockers

- Legal review of FFmpeg LGPL obligations, source-offer/distribution method,
  enabled decoder patent exposure, and intended jurisdictions.
- A separately reviewed final-delivery codec policy. H.264 production encoding
  is not present and is explicitly blocked.
- Vulnerability scanning and remediation against the exact image digest.
  The 2026-07-10 local arm64 Docker Scout scan of the pinned Debian runtime
  reported `CVE-2026-12087` (critical), `CVE-2026-48959` (high), and
  `CVE-2026-48962` (high) in Debian `perl 5.36.0-7+deb12u3`, with no fixed
  package reported. This exact runtime base must not be activated unless that
  finding is removed by a rebuilt/minimized base or accepted through a formal
  security exception.
- An enriched SBOM that explicitly inventories the custom static FFmpeg build;
  generic container scanners may identify the Debian packages but omit FFmpeg
  as a first-class package even though its binaries and hashes are present.
- Multi-architecture build/test evidence and signed OCI provenance/SBOM
  attestations in the chosen private registry.
- Deterministic, signed provenance attestations; the independent no-cache
  rebuild matched the platform manifest, config, layers, and all runtime
  artifacts, while the outer index differed because its fresh attestation
  manifest differed.
- Directory-FD/symlink-safe private artifact mounts, bounded output ownership,
  verification, and atomic promotion in the real worker sandbox.
- Canonical approved snapshot, tenant-bound lease, idempotency, credit,
  cost-event, QA, and audit evidence before any execution.
- Deployed IAM/service identity, egress, resource-quota, monitoring, and
  incident-response evidence.

Until those gates pass, this image remains an isolated internal foundation with
`productReady=false`.
