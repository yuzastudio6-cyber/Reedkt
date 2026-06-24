# TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-EXECUTION-1

Next gate: execute only the approved official GPAC APT install-source lane after `TRACKA-GPAC-MP4BOX-PINNING-KEYRING-INSTALL-SOURCE-PLAN-1`.

Required source truth:

- Repository: `https://dist.gpac.io/gpac/linux/debian`
- Codename: `bookworm`
- Component: `main`
- Blocked component: `nightly`
- Key endpoint: `https://dist.gpac.io/gpac/linux/gpg.asc`
- Future keyring: `/usr/share/keyrings/gpac-archive-keyring.gpg`
- Future source file: `/etc/apt/sources.list.d/gpac.sources`
- Future preferences file: `/etc/apt/preferences.d/gpac.pref`
- Package candidate: `gpac`

The execution lane must verify the key fingerprint, write the source/keyring/preferences only inside the approved Dockerfile target, run `apt-cache policy gpac`, record the exact `main` candidate version, install `gpac=<candidate-version>` only if authorized, and run bounded no-user-media MP4Box proof only after install succeeds.

Do not use `nightly`, Debian sid, Debian bullseye native package paths, random binaries, source build, Bento4 fallback, user media, public artifacts, signed URLs, Supabase/GCS, beta, or production scope.
