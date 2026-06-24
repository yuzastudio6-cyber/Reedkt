# Dockerfile Patch Report

Patched target: `docker/prod/render-worker/Dockerfile`.

The existing render-worker package layer is preserved and adds only required source setup prerequisites `curl` and `gnupg`; `ca-certificates` was already present.

The new GPAC install-source block fetches `https://dist.gpac.io/gpac/linux/gpg.asc`, dearmors it to `/usr/share/keyrings/gpac-archive-keyring.gpg`, writes Deb822 source `/etc/apt/sources.list.d/gpac.sources`, writes package-only preferences `/etc/apt/preferences.d/gpac.pref`, runs `apt-cache policy gpac`, selects a non-empty exact candidate, verifies `https://dist.gpac.io/gpac/linux/debian bookworm/main`, rejects `nightly`, simulates `gpac=<candidate-version>`, installs exactly `gpac=<candidate-version>`, records `dpkg-query -W gpac`, checks `command -v MP4Box`, and cleans apt lists.

No package-lock, requirements, .dockerignore, runtime source, Supabase/SQL, worker/provider code, or product behavior changed.
