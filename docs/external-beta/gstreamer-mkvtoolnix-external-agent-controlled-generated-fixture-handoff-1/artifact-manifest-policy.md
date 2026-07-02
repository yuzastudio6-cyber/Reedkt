# Artifact Manifest Policy

Future guarded execution must write local evidence only under:

`/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-execution-1/<runId>/`

Required generated evidence fields:

- run ID;
- route path;
- confirmation gate;
- idempotency key;
- report file name, byte count, and SHA-256 checksum;
- runtime envelope file name, byte count, and SHA-256 checksum;
- output manifest file name, byte count, and SHA-256 checksum;
- QA report file name, byte count, and SHA-256 checksum;
- manifest file name, byte count, and SHA-256 checksum;
- cleanup status;
- exact safety flags.

Generated evidence is local only and must not be committed. Public artifact creation remains `false`.
