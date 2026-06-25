# APT Source And Keyring Report

Deb822 source file: `/etc/apt/sources.list.d/gpac.sources`.

Fields:

- `Types: deb`
- `URIs: https://dist.gpac.io/gpac/linux/debian`
- `Suites: bookworm`
- `Components: main`
- `Signed-By: /usr/share/keyrings/gpac-archive-keyring.gpg`

Key endpoint: `https://dist.gpac.io/gpac/linux/gpg.asc`. The Dockerfile uses `gpg --dearmor` into `/usr/share/keyrings/gpac-archive-keyring.gpg` and does not use legacy `apt-key`.

Blocked alternatives remain blocked: `nightly`, Debian sid, Debian bullseye native package paths, random binaries, source builds, and Bento4 fallback.
