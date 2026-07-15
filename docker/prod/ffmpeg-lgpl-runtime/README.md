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
`setparams` filters required by the private professional source-color recipe;
caller-authored filter strings remain forbidden.

The image does **not** compile H.264, HEVC, AAC, `libx264`, `libx265`, or
OpenH264 encoders. It does not compile an MP4/MOV muxer. Consequently it is not
a final-delivery image and cannot satisfy the existing H.264/MP4 export plan.
H.264/HEVC/AAC decoding remains included only for internal source analysis and
is still blocked from a production-readiness claim pending codec patent,
commercial-use, distribution, and legal policy review.

FFmpeg's LGPL configure result is important evidence, but it is not legal
approval for FFmpeg, every enabled codec, the base distribution, or commercial
delivery.

## Runtime confinement

The image declares numeric user `65532:65532`. The standalone smoke runs with:

```bash
--network=none
--read-only
--cap-drop=ALL
--security-opt=no-new-privileges:true
--pids-limit=128
--memory=512m
--cpus=2
--tmpfs /tmp:rw,noexec,nosuid,nodev,size=64m,mode=1777
```

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

The smoke checks the immutable configuration, LGPL banner, exact encoder,
decoder, filter, demuxer, muxer, protocol, and bitstream-filter allowlists,
non-root identity, read-only root, network-none runtime, all runtime evidence
hashes, synthetic FFV1+PCM intermediate creation, ffprobe JSON, frame
extraction, the bounded BT.709 lossless-VP9 professional color chain, and deterministic
video/audio analysis filters.

It processes synthetic media only. It does not read user artifacts or unlock
workers, routes, rendering, previews, or export.

## SBOM and digest evidence

For a locally built image:

```bash
docker image inspect --format '{{.Id}}' reeditpro/ffmpeg-lgpl-internal:8.1.2-color-v1-local
docker sbom --format spdx-json reeditpro/ffmpeg-lgpl-internal:8.1.2-color-v1-local > /tmp/reeditpro-ffmpeg-8.1.2-color-v1.spdx.json
sha256sum /tmp/reeditpro-ffmpeg-8.1.2-color-v1.spdx.json
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
