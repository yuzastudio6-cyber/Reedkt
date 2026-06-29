# GPAC/MP4Box Guarded Service-Role Route Mock Contract

Route id: `render.gpacMp4box.serviceRolePackageMock`.

Route path: `/api/render/gpac-mp4box/package/mock`.

The route is backend-only and service-role-owned. It is registered in the API route map but intentionally disabled for runtime execution. The mock API router returns `backend_runtime_required` for this route because the route has `requiresServiceRole: true`, `runtimeMode: backend_required`, and `status: disabled`.

Required route input refs:
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

Accepted command template ids are inherited from the TypeScript-only mock worker interface:
- `mp4box_add_generated_subtitle_only_v1`
- `mp4box_info_generated_subtitle_only_v1`
- `mp4box_package_validation_metadata_v1`

Rejected route input classes:
- `rawChat`
- `rawCommandString`
- `frontendFilePath`
- `publicUrl`
- `signedUrlAsSourceOfTruth`
- `arbitraryPrivateMedia`
- `providerModelPromptPayload`
- `serviceRoleSecretPayload`
- `broadServiceRoleHandlerPayload`

Allowed sanitized response shape:
- `jobRef`
- `routeStatus`
- `sanitizedBlockers`
- `manifestRefs`
- `qaReportRefs`
- `cleanupRefs`
- `auditRefs`
- `nextRequiredGate`

Next required gate: `TRACKA-GPAC-MP4BOX-GUARDED-WORKER-ENQUEUE-MOCK-IMPLEMENTATION-1`.

No route execution, worker execution, GPAC/MP4Box execution, media processing, storage transfer, Supabase mutation, SQL execution, signed/public artifact creation, or beta/production unlock is enabled.
