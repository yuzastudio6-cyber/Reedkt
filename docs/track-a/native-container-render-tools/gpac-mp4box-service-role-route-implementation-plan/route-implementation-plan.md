# GPAC/MP4Box Service-Role Route Implementation Plan

Future route owner: `backend_service_role_only`.

Future route class: `guarded_mock_route_implementation_first`.

The future guarded route mock implementation packet may add backend-only route metadata and mock-safe request/response shaping, but it must remain disabled for runtime execution until a later explicit worker execution packet.

Required future route input contract:
- `approvedSnapshotRef`
- `approvalRecordRef`
- `creditReservationRef`
- `jobRef`
- `workerLeaseRef`
- `routeIdempotencyKey`
- `sourceSequenceMapRef`
- `compiledIntentRef`
- `modelRoutingPolicyRef`
- `qaPolicyRef`
- `privateInputManifestRef`
- `privateArtifactManifestRef`
- `privateArtifactChecksumRef`
- `toolRuntimePolicyRef`
- `gpacMp4boxWorkerContractRef`
- `gpacMp4boxRouteContractRef`
- `cleanupPolicyRef`
- `auditRecordRef`
- `commandTemplateId`

Required future preflight gates:
- approved snapshot status must be approved;
- approval record must match the approved snapshot;
- credit reservation reference must be present but not spent in the planning packet;
- route idempotency key must match the mock worker interface envelope;
- command template id must be one of the mock worker interface allowlist values;
- private input manifest must be checksum-addressed and private;
- private artifact manifest must reject public artifacts and signed URL source-of-truth;
- cleanup policy and QA report refs must be present;
- service-role credential material must never be returned, logged, or bundled into frontend code.

Rejected future route inputs:
- raw chat;
- raw command string;
- frontend file path;
- public URL;
- signed URL as source-of-truth;
- arbitrary private media;
- provider/model prompt payload;
- service-role secret payload;
- broad service-role handler payload.

Allowed future response shape:
- `jobRef`;
- `routeStatus`;
- `sanitizedBlockers`;
- `manifestRefs`;
- `qaReportRefs`;
- `cleanupRefs`;
- `auditRefs`;
- `nextRequiredGate`.

This packet does not create route files, execute a route, enqueue a worker, call GPAC/MP4Box, transfer storage, mutate Supabase, run SQL, create signed/public artifacts, or unlock beta/production.
