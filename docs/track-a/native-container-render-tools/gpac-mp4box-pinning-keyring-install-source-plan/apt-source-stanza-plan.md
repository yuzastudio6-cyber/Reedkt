# APT Source Stanza Plan

Future source type: Deb822 `.sources` file.

Future source path: `/etc/apt/sources.list.d/gpac.sources`

Future stanza text only:

```text
Types: deb
URIs: https://dist.gpac.io/gpac/linux/debian
Suites: bookworm
Components: main
Signed-By: /usr/share/keyrings/gpac-archive-keyring.gpg
```

Component `main` is the only planned source component. Component `nightly` remains blocked. Debian sid, Debian bullseye native package paths, random binary downloads, source build, and Bento4 fallback remain blocked for the GPAC/MP4Box command path.

This phase does not create `/etc/apt/sources.list.d/gpac.sources`, run `apt update`, install `gpac`, mutate Dockerfiles, or approve runtime/product use.
