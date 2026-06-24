# Pinning Keyring Install-Source Policy

The official GPAC APT repository is accepted only for the next install-source planning gate.

Next prompt: `TRACKA-GPAC-MP4BOX-PINNING-KEYRING-INSTALL-SOURCE-PLAN-1`

The next gate must define:

- exact repository URI
- codename `bookworm`
- component `main` only
- public key endpoint plus fingerprint review
- keyring path
- `Signed-By` source stanza
- apt pinning and package version selection
- architecture policy
- rollback policy
- Dockerfile patch scope
- no-media and no-runtime guardrails

This phase does not approve `apt update`, `apt install`, `gpac`, MP4Box execution, Dockerfile mutation, package-lock mutation, requirements mutation, runtime source mutation, or product use.
