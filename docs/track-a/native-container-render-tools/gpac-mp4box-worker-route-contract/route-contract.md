# GPAC/MP4Box Worker Route Contract

Decision: `tracka_gpac_mp4box_worker_route_contract_passed_ready_for_mock_worker_interface_packet`

Execution: `completed_docs_only_route_contract_no_runtime_execution`

Future route contract:
- route owner: backend/service-role lane only;
- accepted request inputs: `approvedSnapshotRef`, `approvalRecordRef`, `jobRef`, `routeIdempotencyKey`, `privateInputManifestRef`, `gpacMp4boxRouteContractRef`;
- rejected request inputs: raw chat, raw command strings, frontend file paths, public URLs, signed URLs as source-of-truth, arbitrary private media, and provider/model prompt payloads;
- required pre-enqueue checks: approved snapshot status, approval/credit gate, idempotency, private input manifest checksum, command template id, and retention/cleanup policy reference;
- allowed response shape: job id, status, sanitized blockers, manifest refs, QA report refs, cleanup refs, and audit refs only.

This route contract does not implement a route, execute a route, enqueue a worker, execute GPAC/MP4Box, mutate Supabase, run SQL, transfer storage, create signed/public artifacts, or unlock beta/production.
