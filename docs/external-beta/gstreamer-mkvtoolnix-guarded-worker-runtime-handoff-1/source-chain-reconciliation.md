# Source Chain Reconciliation

The GStreamer/MKVToolNix lane has two evidence strands that must be reconciled before external agent worker runtime execution can progress:

1. Earlier controlled runtime evidence proved the bounded generated-fixture command templates in the local render-worker image.
2. The newer route-dispatch and worker-dispatch packets proved the post-route metadata envelope and local mock worker-dispatch handoff shape.

This packet does not repeat either execution path. It records the reconciliation point:

| Evidence strand | Accepted status | Handoff use |
| --- | --- | --- |
| Controlled generated fixture runtime evidence | `completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture` | Command-template evidence only |
| Agent-controlled runtime QA rollup | `qa_passed_agent_controlled_worker_runtime_evidence` | QA source evidence only |
| Route-dispatch execution packet | `completed_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_execution_packet_metadata_only` | Route metadata source only |
| Worker-dispatch execution packet | `completed_gstreamer_mkvtoolnix_guarded_worker_dispatch_execution_packet_metadata_only` | Local mock worker-dispatch metadata source only |

The next packet must not claim production readiness from either strand alone. It must explicitly combine the approved snapshot/job/lease/manifest/QA/cleanup references with the command-template allowlist and the worker runtime gate.

Readiness: `ready_for_confirmation_gated_post_dispatch_worker_runtime_execution_packet`

Product-ready end-to-end local OSS tools: `0`
