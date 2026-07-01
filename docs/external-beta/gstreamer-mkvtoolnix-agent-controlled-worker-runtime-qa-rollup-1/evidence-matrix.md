# Evidence Matrix

| Evidence | Status | Source |
| --- | --- | --- |
| Agent-controlled worker queue metadata | `passed` | PR #1902, run ID `2026-06-30T19-45-59-915Z-af80c9f8` |
| Agent-controlled worker dispatch dry-run metadata | `passed` | PR #1905, run ID `2026-06-30T20-56-18-927Z-8e5d25d9` |
| Agent-controlled runtime packet | `passed` | PR #1918, run ID `2026-07-01T00-16-10-927Z-8b7402d8` |
| Guarded generated-fixture runtime | `passed` | run ID `2026-07-01T00-16-10-989Z-a9752eae` |
| Approved snapshot reference | `preserved` | `approved-snapshot-agent-controlled-dispatch-1` |
| Approval record reference | `preserved` | `approval-record-agent-controlled-dispatch-1` |
| Credit policy reference | `preserved_no_spend_fixture_policy` | `no-spend-fixture-policy-agent-controlled-dispatch-1` |
| Job reference | `preserved_without_persistent_queue_write` | `job-agent-controlled-dispatch-1` |
| Worker lease reference | `preserved_without_claim` | `worker-lease-agent-controlled-dispatch-1` |
| Route idempotency key | `preserved_without_route_execution` | `gstreamer-mkvtoolnix:agent-controlled-dispatch-1:approved-snapshot:job:template` |
| GStreamer generated fixture execution | `accepted_from_1918` | `completed_controlled_generated_fixture_only` |
| MKVToolNix generated fixture execution | `accepted_from_1918` | `completed_controlled_generated_fixture_only` |
| Product-ready end-to-end local OSS tools | `0` | preserved |

Artifact checksums accepted from PR #1918:
- `f61416714a8ac4333448e7f1d6e3f2351c7bb29faab4473fc920e1bb94c7b45a`
- `b3cf94090b250dc1fb5e4ebbd7cb56cbe4d6bdbd070d28243f2756c2a98e16d9`
- `1a9321f9272b184f5003cac99c338bc8d011f33e87e79e07612dca0a7e8aab3e`
- `af90e2292be7af0f72cbec78fe512cb63ff4b5ea4d10c995d6c7500d6ad9f332`
- `a3942b2e55ca80c4ea954db1164d1117cdb238761225bcfc1a3d7edf1fccda93`
