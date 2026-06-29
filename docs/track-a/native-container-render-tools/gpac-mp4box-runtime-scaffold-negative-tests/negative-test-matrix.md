# Negative Test Matrix

The negative smoke `server/smoke/tracka-gpac-mp4box-runtime-scaffold-negative-tests-smoke.ts` validates the disabled scaffold baseline and then flips one forbidden input or safety switch at a time.

Rejected input coverage:

- `rawChat` -> `blocked_rejected_input_present`
- `rawCommandString` -> `blocked_rejected_input_present`
- `frontendFilePath` -> `blocked_rejected_input_present`
- `publicUrlSourceOfTruth` -> `blocked_rejected_input_present`
- `signedUrlSourceOfTruth` -> `blocked_rejected_input_present`
- `arbitraryPrivateMedia` -> `blocked_rejected_input_present`
- `providerOrModelPromptPayload` -> `blocked_rejected_input_present`
- `serviceRoleSecretPayload` -> `blocked_rejected_input_present`
- `broadServiceRoleHandlerPayload` -> `blocked_rejected_input_present`

Runtime attempt coverage:

- `routeExecution` -> `blocked_runtime_execution_attempt`
- `workerDispatch` -> `blocked_runtime_execution_attempt`
- `workerExecution` -> `blocked_runtime_execution_attempt`
- `gpacMp4boxExecution` -> `blocked_runtime_execution_attempt`
- `mediaProcessing` -> `blocked_runtime_execution_attempt`
- `supabaseMutation` -> `blocked_runtime_execution_attempt`
- `sqlExecution` -> `blocked_runtime_execution_attempt`

Delivery/unlock attempt coverage:

- `storageTransfer` -> `blocked_storage_or_public_delivery_attempt`
- `signedUrlCreation` -> `blocked_storage_or_public_delivery_attempt`
- `publicArtifactCreation` -> `blocked_storage_or_public_delivery_attempt`
- `externalBetaExpansion` -> `blocked_storage_or_public_delivery_attempt`
- `paidProductionUnlock` -> `blocked_storage_or_public_delivery_attempt`
- `productionUnlock` -> `blocked_storage_or_public_delivery_attempt`

Required reference coverage:

- invalid enablement plan -> `blocked_enablement_plan_invalid`
- enabled runtime flag -> `blocked_runtime_flag_not_disabled`
- missing approved snapshot -> `blocked_missing_approved_snapshot_ref`
- missing disabled service-role route -> `blocked_missing_service_role_route_ref`
- enabled worker dispatch -> `blocked_missing_worker_dispatch_ref`
- missing private artifact manifest -> `blocked_missing_private_artifact_refs`
- raw commands allowed in allowlist -> `blocked_missing_command_allowlist_ref`
- missing QA reference -> `blocked_missing_qa_cleanup_audit_refs`
- missing residue validation -> `blocked_missing_rollback_or_residue_refs`
