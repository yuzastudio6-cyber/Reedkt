# Runtime Checks

Network-disabled container checks passed.

Package:

- `dpkg-query -W gpac` returned `gpac	26.02-rev0-g118e60a90-HEAD`.
- `dpkg --print-architecture` returned `arm64`.

APT source files:

- `/usr/share/keyrings/gpac-archive-keyring.gpg`
- `/etc/apt/sources.list.d/gpac.sources`
- `/etc/apt/preferences.d/gpac.pref`
- repository `https://dist.gpac.io/gpac/linux/debian`, suite `bookworm`, component `main`
- blocked component `nightly`

MP4Box:

- `command -v MP4Box` returned `/usr/bin/MP4Box`.
- `MP4Box -version` passed and printed `MP4Box - GPAC version 26.02-rev0-g118e60a90-HEAD`.
- No MP4Box media command ran.

GPAC CLI:

- `command -v gpac` returned `/usr/bin/gpac`.
- `gpac -h` passed and printed the command-line usage header.
- The command created only a container-local `/root/.gpac/creds.key`; it was not copied out, committed, uploaded, or used as product evidence.
