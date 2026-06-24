# Future Dockerfile Patch Proposal

Future target, if approved by the next execution prompt: `docker/prod/render-worker/Dockerfile`

This is text-only planning. No Dockerfile patch is approved or applied here.

Future patch categories:

- Install minimal source-management prerequisites: `ca-certificates curl gnupg`.
- Fetch `https://dist.gpac.io/gpac/linux/gpg.asc` only after fingerprint policy is approved.
- Write dearmored keyring to `/usr/share/keyrings/gpac-archive-keyring.gpg`.
- Write Deb822 source file to `/etc/apt/sources.list.d/gpac.sources`.
- Write package-only preferences file to `/etc/apt/preferences.d/gpac.pref`.
- Run `apt-get update` only in the future execution lane.
- Inspect `apt-cache policy gpac`.
- Install `gpac=<candidate-version>` only after the candidate is recorded and verified as component `main`.
- Clean `/var/lib/apt/lists/*`.

Blocked now: Dockerfile mutation, apt source mutation, key import, apt update, package installation, GPAC/MP4Box execution, media processing, runtime approval, and product approval.
