# Debian Bookworm Main Review

Selected future repository target: `https://dist.gpac.io/gpac/linux/debian`

Selected codename: `bookworm`

Selected component: `main`

Blocked component: `nightly`

The `main` component is accepted as the only future GPAC APT component for install-source planning. The `nightly` component remains blocked because it carries development-build semantics and is not needed for the conservative MP4Box command path.

Package candidate: `gpac`

Observed package versions in `main/binary-amd64/Packages`:

- `2.4-rev0-g5d70253ac-HEAD`
- `26.02-rev0-g118e60a90-HEAD`

The package index currently exposes multiple versions and a package metadata license field of `unknown`; this does not block metadata approval of the official source class, but it does require the next plan to define version pinning, apt preference behavior, package metadata review, rollback policy, and install-source boundaries before any mutation.

Runtime compatibility is not proven here. Dockerfile mutation, apt source mutation, apt key import, apt update, package installation, GPAC/MP4Box execution, and product use all remain unapproved.
