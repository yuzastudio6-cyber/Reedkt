# TRACKA-GPAC-MP4BOX-OFFICIAL-APT-REPO-APPROVAL-1

Goal: approve or reject the exact official GPAC APT repository setup for a later bounded GPAC/MP4Box execution lane.

Source-of-truth context:

- `TRACKA-GPAC-MP4BOX-OWNER-SOURCE-CLASSIFICATION-REQUEST-1` decision: `tracka_gpac_mp4box_owner_source_classification_passed_ready_for_official_gpac_apt_repo_approval`.
- Selected source class: `official_gpac_apt_repository`.
- Repository URI candidate: `https://dist.gpac.io/gpac/linux/debian`.
- Codename: `bookworm`.
- Component candidate: `main`.
- Blocked component: `nightly`.
- Key URL candidate: `https://dist.gpac.io/gpac/linux/gpg.asc`.
- Package candidate: `gpac`.
- Bento4 remains `separate_not_selected_for_mp4box_command_path`.

Approval requirements:

- Confirm exact key fingerprint and keyring path.
- Confirm source-list format with `signed-by`.
- Confirm architecture target.
- Confirm version pin or apt preference because multiple `gpac` versions are visible in the package index.
- Confirm rollback/removal policy.
- Confirm that no execution is approved until a later bounded Docker execution PR.

Blocked scope: no GPAC/MP4Box execution, Bento4 execution, Docker build/run, package install, FFmpeg/FFprobe, media processing, render/export, Supabase/SQL/GCS, signed/public artifacts, beta, production, package-lock mutation, Dockerfile mutation, requirements mutation, or runtime source mutation in the approval phase.

Product-ready local OSS tools: `0`. Track B FFmpeg/FFprobe ownership remains preserved. Supabase classification: no write / environment none / SQL none / migration no.
