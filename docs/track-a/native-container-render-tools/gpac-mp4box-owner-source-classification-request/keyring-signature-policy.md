# Keyring And Signature Policy

Key source endpoint: `https://dist.gpac.io/gpac/linux/gpg.asc`

Observed status: `HTTP 200`

Observed SHA-256: `c88993c228200dece139005eb28fec06b7f3933122fee5612a85d4cb5b94c7ad`

Future keyring path candidate: `/usr/share/keyrings/gpac-archive-keyring.gpg`

This phase does not import or dearmor the key. The next approval lane must explicitly approve the key fingerprint, `signed-by` source entry, key rotation policy, and rollback/removal command.
