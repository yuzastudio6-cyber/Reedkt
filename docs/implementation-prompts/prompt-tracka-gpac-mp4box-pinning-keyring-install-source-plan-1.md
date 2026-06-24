# TRACKA-GPAC-MP4BOX-PINNING-KEYRING-INSTALL-SOURCE-PLAN-1

Implement a metadata-only plan for the official GPAC APT repository install-source lane after `TRACKA-GPAC-MP4BOX-OFFICIAL-APT-REPO-APPROVAL-1`.

Do not install GPAC or run MP4Box in the planning phase.

Required plan scope:

- repository URI `https://dist.gpac.io/gpac/linux/debian`
- codename `bookworm`
- component `main` only
- blocked component `nightly`
- public key endpoint `https://dist.gpac.io/gpac/linux/gpg.asc`
- exact key fingerprint and keyring path policy
- `Signed-By` source stanza
- apt pinning and version selection
- package candidate `gpac`
- architecture policy
- rollback policy
- exact Dockerfile patch proposal for a later execution PR
- no media, no runtime, no Supabase/GCS, no beta, no production

The planning phase may not mutate apt sources, import keys, run `apt update`, install packages, mutate Dockerfiles, mutate requirements, mutate package-lock, mutate runtime source, or execute GPAC/MP4Box.

Expected next decision:

`tracka_gpac_mp4box_pinning_keyring_install_source_plan_passed_ready_for_official_apt_install_source_execution`
