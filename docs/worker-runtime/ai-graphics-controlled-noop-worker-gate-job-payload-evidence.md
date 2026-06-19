# Job Payload Evidence

The controlled no-op executor reads the committed docs-only fixtures:

| Fixture | Status |
| --- | --- |
| `docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.valid.json` | Valid shape template parsed. |
| `docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.blocked.json` | Blocked shape template parsed. |
| `docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.invalid.json` | Invalid shape template parsed. |
| `docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-shape.schema.json` | Schema fixture parsed. |

The payload evidence requires placeholder plan snapshot ids, scoped manifest ids, private artifact refs, checksum refs, claim placeholders, lease placeholders, queue placeholders, observability refs, false runtime booleans, and no-execution proof fields.
