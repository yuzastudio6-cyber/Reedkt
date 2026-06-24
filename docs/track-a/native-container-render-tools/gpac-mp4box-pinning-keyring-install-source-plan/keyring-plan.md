# Keyring Plan

Future key endpoint: `https://dist.gpac.io/gpac/linux/gpg.asc`

PR #729 recorded endpoint SHA-256: `c88993c228200dece139005eb28fec06b7f3933122fee5612a85d4cb5b94c7ad`

Future keyring path: `/usr/share/keyrings/gpac-archive-keyring.gpg`

Future import strategy: fetch the key, verify fingerprint/checksum policy, then dearmor to the keyring path. `apt-key` remains blocked.

Future execution must fail closed if the fingerprint cannot be derived, does not match the execution prompt, or the key changes unexpectedly. This phase does not fetch the key, import the key, write a keyring, approve a keyring mutation, run apt, or approve runtime/product use.
