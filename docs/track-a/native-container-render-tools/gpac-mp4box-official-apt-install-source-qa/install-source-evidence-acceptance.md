# Install Source Evidence Acceptance

QA accepts PR #738 as bounded install-source evidence for GPAC/MP4Box:

- official GPAC APT source `https://dist.gpac.io/gpac/linux/debian`;
- Debian suite `bookworm`;
- component `main`;
- blocked component `nightly`;
- key endpoint `https://dist.gpac.io/gpac/linux/gpg.asc`;
- Deb822 source with `Signed-By: /usr/share/keyrings/gpac-archive-keyring.gpg`;
- package-only pin for `gpac`;
- exact install `gpac=26.02-rev0-g118e60a90-HEAD`;
- no non-`gpac` packages sourced from `dist.gpac.io`.

QA does not accept runtime behavior, media processing, product runtime, beta, or production readiness from this evidence. `MP4Box -version` and MP4Box media commands remain future-only.
