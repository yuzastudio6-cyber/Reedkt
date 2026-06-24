# Official GPAC APT Source Class

Selected source class: `official_gpac_apt_repository`

Decision: `tracka_gpac_mp4box_owner_source_classification_passed_ready_for_official_gpac_apt_repo_approval`

Official docs: https://gpac.io/downloads/gpac-nightly-builds/

## Evidence

The official GPAC Debian repository endpoint was checked as source metadata only:

- `https://dist.gpac.io/gpac/linux/debian/dists/bookworm/Release`: `HTTP 200`
- Release codename: `bookworm`
- Components: `main`, `nightly`
- Selected component for future review: `main`
- Blocked component: `nightly`
- Architectures listed: `amd64`, `i386`, `armhf`, `arm64`
- `https://dist.gpac.io/gpac/linux/gpg.asc`: `HTTP 200`, content type `application/pgp-keys`
- `https://dist.gpac.io/gpac/linux/debian/dists/bookworm/main/binary-amd64/Packages`: `HTTP 200`
- Future package name candidate: `gpac`

Observed hashes for review reproducibility:

- `gpg.asc` SHA-256: `c88993c228200dece139005eb28fec06b7f3933122fee5612a85d4cb5b94c7ad`
- Debian bookworm Release SHA-256: `18bce363dc74f1bd13e9af5fa71545d470605134359e1be79339388c4f246ff1`
- `main/binary-amd64/Packages` SHA-256: `565259a5111d6294b6ee93a979677eeab55ca23f4e7e0266af711aaffb036a04`

This phase classifies the official APT source class only. It does not add a repo, import a key, run `apt-get`, install `gpac`, run MP4Box, edit Dockerfiles, or approve runtime execution.
