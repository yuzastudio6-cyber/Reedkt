# Official APT Repository Metadata

Decision: `tracka_gpac_mp4box_official_apt_repo_approval_passed_ready_for_pinning_keyring_install_source_plan`

The approved metadata source class remains `official_gpac_apt_repository`.

Official GPAC documentation reviewed: https://gpac.io/downloads/gpac-nightly-builds/

Observed repository metadata:

- Repository URI candidate: `https://dist.gpac.io/gpac/linux/debian`
- Release endpoint: `https://dist.gpac.io/gpac/linux/debian/dists/bookworm/Release`
- Release status: `HTTP 200`
- Release SHA-256: `18bce363dc74f1bd13e9af5fa71545d470605134359e1be79339388c4f246ff1`
- Origin: `https://dist.gpac.io`
- Codename: `bookworm`
- Components listed: `main`, `nightly`
- Selected component: `main`
- Blocked component: `nightly`
- Architectures listed: `amd64`, `i386`, `armhf`, `arm64`
- Main amd64 packages endpoint: `https://dist.gpac.io/gpac/linux/debian/dists/bookworm/main/binary-amd64/Packages`
- Main amd64 packages SHA-256: `565259a5111d6294b6ee93a979677eeab55ca23f4e7e0266af711aaffb036a04`

This approval is only for future install-source planning. It does not add the repository, import the signing key, run `apt update`, install `gpac`, execute MP4Box, mutate Dockerfiles, mutate requirements, or approve runtime/product use.
