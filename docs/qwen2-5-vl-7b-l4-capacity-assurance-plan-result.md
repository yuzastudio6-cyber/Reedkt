# Qwen2.5-VL 7B L4 Capacity Assurance Plan Result

## Status

Decision: `qwen2_5_vl_7b_l4_capacity_assurance_plan_ready_for_reservation_approval_no_vm_no_inference`

This packet records the no-VM/no-inference capacity-assurance decision after five approved Qwen2.5-VL L4 proof attempts stocked out for the selected `g2-standard-8` plus one NVIDIA L4 shape.

This plan did not create a VM, disk, address, reservation, firewall rule, service account, service-account key, bucket, Artifact Registry image, Cloud Run job, IAP tunnel, SSH session, dependency install, CUDA proof, vLLM import proof, model import, model inference, generated media, provider call, worker dispatch, Supabase mutation, SQL, public artifact, signed URL, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Source Evidence

- `us-east1-b` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-east1-b-result.md`
- Capacity follow-up: `docs/qwen2-5-vl-7b-l4-capacity-followup-result.md`
- `us-west1-a` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-west1-a-result.md`
- `us-central1-c` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-central1-c-result.md`
- `us-central1-a` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-central1-a-result.md`
- `us-central1-b` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-result.md`
- Proof identity and IAP firewall evidence: `docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md`
- Earlier private VM create evidence: `docs/ai-video-broll-generation-gcp-private-vm-create-execute-result.md`
- Private wheelhouse import proof: `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`

## Repo Evidence Review

The Qwen lane has already completed:

- stack-tool registration for `qwen_vl`;
- revision pinning for `Qwen/Qwen2.5-VL-7B-Instruct`;
- private model cache checksum verification;
- Linux Python 3.12 / CUDA wheelhouse preparation;
- offline wheelhouse import proof;
- metadata-only loader gate proof;
- GPU quota fix for one project-wide GPU;
- repeated bounded no-public-IP L4 proof attempts.

The adjacent GCP proof lane already established a proof-only service account and IAP-source SSH firewall scoped to the proof tag. It also treats reservations as an explicit runtime/cost surface, not something to create implicitly during a retry.

## Stockout Summary

| Attempt | Region | Zone | Shape | Result |
| --- | --- | --- | --- | --- |
| 1 | `us-central1` | `us-central1-b` | `g2-standard-8` + one `nvidia-l4` | stockout |
| 2 | `us-central1` | `us-central1-a` | `g2-standard-8` + one `nvidia-l4` | stockout |
| 3 | `us-central1` | `us-central1-c` | `g2-standard-8` + one `nvidia-l4` | stockout |
| 4 | `us-west1` | `us-west1-a` | `g2-standard-8` + one `nvidia-l4` | stockout |
| 5 | `us-east1` | `us-east1-b` | `g2-standard-8` + one `nvidia-l4` | stockout |

Each attempt left no VM, disk, address, reservation, or quota usage behind.

## Option Decision

| Option | Decision | Reason |
| --- | --- | --- |
| Immediate sixth zonal retry | rejected | Five stocked-out attempts across three U.S. regions is enough evidence that another immediate blind retry is low signal. |
| Scheduled off-peak retry only | partial | It is cheap and safe, but does not solve capacity deterministically. |
| Reservation or capacity assurance | recommended next approval path | It directly addresses repeated stockout but requires explicit cost, cleanup, and mutation boundaries. |
| Smaller dependency-only smoke | not runtime proof | It may prove some package mechanics, but it cannot prove the selected production-adjacent L4/G2 runtime target. |
| Change selected GPU away from L4 | rejected for now | L4 remains the best first GPU for Qwen2.5-VL 7B cost/performance in this repo lane; changing GPU would require a separate GPU-selection review. |

## Capacity Assurance Recommendation

Prepare a separate reservation/capacity-assurance approval packet before any mutation.

The next packet should:

- keep Qwen on NVIDIA L4 / Google Cloud G2;
- select one target region/zone from repo evidence, with `us-east1` and `us-west4` as candidates;
- estimate the bounded proof window and cleanup plan;
- decide whether to create a short-lived reservation or use a scheduled retry window;
- require exact resource absence checks before mutation;
- require an explicit no-inference/no-serving proof boundary;
- require deletion/cleanup verification in the same prompt that creates any reserved capacity;
- preserve all provider, worker, Supabase, SQL, public artifact, signed URL, billing, beta, and production gates.

## Runtime Gates

- `gcpReadOnlyCommandsExecuted=true`
- `gcpMutatingCommandsExecuted=false`
- `reservationApprovalRecommended=true`
- `reservationCreated=false`
- `scheduledRetryOnly=false`
- `smallerImportSmokeRecommended=false`
- `gpuSelectionChanged=false`
- `vmCreated=false`
- `diskCreated=false`
- `externalIpCreated=false`
- `networkChanged=false`
- `serviceAccountCreated=false`
- `serviceAccountKeyCreated=false`
- `firewallRuleCreated=false`
- `bucketCreated=false`
- `artifactRegistryImageCreated=false`
- `cloudRunJobCreated=false`
- `iapTransferExecuted=false`
- `sshSessionOpened=false`
- `dependencyInstalledOnVm=false`
- `runtimeImportRunOnL4=false`
- `cudaVisibilityCheckedOnL4=false`
- `vllmImportedOnL4=false`
- `sglangImportedOnL4=false`
- `apiServerStarted=false`
- `modelImportRun=false`
- `modelInferenceRun=false`
- `generatedVideoCreated=false`
- `generatedAssetsCreated=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Product Boundary

Qwen2.5-VL remains a visual understanding, planning, and QA stack tool. It is not an AI-video generation route, not a provider fallback, and not a substitute for approved edit plans, credit approval, or worker contracts. Wan remains the primary generated B-roll route. Qwen ranks for visual analysis, source-frame understanding, OCR/layout/caption QA, and advisory planning where deterministic tools are insufficient.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_9-RESERVATION-APPROVAL: approve bounded L4 capacity reservation plan for Qwen proof, no VM/no inference`
