# Evidence Manifest Requirements

Future confirmed execution must write local evidence only under:

`/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-execution-1/<runId>/`

Required evidence files after a confirmed run:

- `external-agent-controlled-generated-fixture-execution-report.json`
- `external-agent-controlled-generated-fixture-runtime-envelope.json`
- `external-agent-controlled-generated-fixture-output-manifest.json`
- `external-agent-controlled-generated-fixture-qa-report.json`
- `external-agent-controlled-generated-fixture-manifest.json`

Required evidence fields after a confirmed run:

- run ID;
- route path;
- confirmation gate;
- idempotency key;
- generated fixture source identity;
- report file name, byte count, and SHA-256 checksum;
- runtime envelope file name, byte count, and SHA-256 checksum;
- output manifest file name, byte count, and SHA-256 checksum;
- QA report file name, byte count, and SHA-256 checksum;
- manifest file name, byte count, and SHA-256 checksum;
- cleanup status;
- exact safety flags.

Current packet evidence status:

- Report files generated: `none`.
- Route evidence generated: `none`.
- Generated artifacts committed: `none`.
- Public artifact creation: `false`.
- Product-ready end-to-end local OSS tools: `0`.
