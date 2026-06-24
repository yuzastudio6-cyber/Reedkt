# APT Pinning Report

Preferences file: `/etc/apt/preferences.d/gpac.pref`.

Pinning is package-only:

- `Package: gpac`
- `Pin: origin "dist.gpac.io"`
- `Pin-Priority: 501`

The Dockerfile simulates `apt-get install --no-install-recommends gpac=<candidate-version>` before install and fails if any simulated non-`gpac` package comes from `dist.gpac.io`.
