# Three-Tool External-Agent Artifact Manifest Policy

Future external-agent generated-fixture execution evidence must be local and sanitized.

Required output directory template:

`/tmp/reeditpro-tracka-three-tool-external-agent-controlled-generated-fixture-execution-1/<runId>/`

Required evidence:

- execution report JSON;
- execution manifest JSON;
- private input manifest JSON;
- output manifest JSON;
- QA report JSON;
- command matrix;
- file names;
- byte counts;
- SHA-256 checksums;
- cleanup result;
- failure category if blocked.

Generated fixture files may exist only under `/tmp` for the current run and must not be committed.

Package-lock: `unchanged`

Generated artifacts committed: `none`
