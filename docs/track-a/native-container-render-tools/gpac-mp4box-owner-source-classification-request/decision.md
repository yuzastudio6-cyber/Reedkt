# GPAC/MP4Box Owner Source Classification Decision

Decision: `tracka_gpac_mp4box_owner_source_classification_passed_ready_for_official_gpac_apt_repo_approval`

Selected source class: `official_gpac_apt_repository`

This phase advances GPAC/MP4Box from a generic owner/environment source blocker to a specific official GPAC APT repository approval review. It does not approve install or runtime execution.

Future approval target:

- Repository URI candidate: `https://dist.gpac.io/gpac/linux/debian`
- Codename: `bookworm`
- Component: `main`
- Key URL: `https://dist.gpac.io/gpac/linux/gpg.asc`
- Package name candidate: `gpac`
- Required before execution: explicit key/fingerprint policy, signed-by keyring path, version pin or apt preference, architecture, rollback command, and bounded Docker execution plan.

Bento4 remains `separate_not_selected_for_mp4box_command_path`.

Product-ready local OSS tools: `0`. Track B FFmpeg/FFprobe ownership remains preserved. #577 remains open/draft/blocked and excluded as source-of-truth.

Next prompt: `TRACKA-GPAC-MP4BOX-OFFICIAL-APT-REPO-APPROVAL-1`.

Supabase classification: no write / environment none / SQL none / migration no.
