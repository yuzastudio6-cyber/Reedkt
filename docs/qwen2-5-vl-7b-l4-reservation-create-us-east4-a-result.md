# Qwen2.5-VL 7B L4 Reservation Create US East4 A Result

## Status

Decision: `qwen2_5_vl_7b_l4_reservation_create_us_east4_a_blocked_by_gpu_availability_no_vm_no_inference`

This packet records the bounded Qwen2.5-VL L4 reservation-create attempt in `us-east4-a` after the capacity remediation packet selected an unattempted L4 region with quota and visible `g2-standard-8` plus `nvidia-l4` shape.

The attempt repeated the safety preflight, then attempted exactly one approved specific reservation for `g2-standard-8` plus one NVIDIA L4 in `us-east4-a`. Google Cloud rejected the reservation create before a reservation existed because the zone did not have enough GPU capacity for the requested shape.

No reservation, VM, disk, external IP, address, SSH session, IAP transfer, dependency install on VM, CUDA proof, vLLM import proof, model import, model inference, generated media, provider call, worker dispatch, Supabase mutation, SQL, public artifact, signed URL, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim was created.

## Source Evidence

- Capacity remediation result: `docs/qwen2-5-vl-7b-l4-capacity-remediation-result.md`
- Latest retry result: `docs/qwen2-5-vl-7b-l4-reservation-create-us-east1-b-retry-result.md`
- `us-east1-c` result: `docs/qwen2-5-vl-7b-l4-reservation-create-us-east1-c-result.md`
- `us-west4-c` result: `docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-c-result.md`
- `us-west4-a` result: `docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-a-result.md`
- Initial reservation result: `docs/qwen2-5-vl-7b-l4-reservation-create-result.md`
- Proof identity and IAP firewall evidence: `docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md`
- Private wheelhouse import proof: `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`

## Safety Preflight

The following preflight checks passed before the reservation-create attempt:

| Area | Result |
| --- | --- |
| Git branch | `codex/qwen2-5-vl-7b-l4-reservation-create-us-east4-a` |
| Tracked worktree before attempt | clean |
| Active project | `reeditpro` |
| Active account | present |
| Target zone | `us-east4-a` |
| Target reservation before create | absent |
| Exact proof VM before create | absent |
| Exact proof disk before create | absent |
| Exact proof address before create | absent |
| Active reservations before create | none |
| Machine type | `g2-standard-8` visible |
| Accelerator | `nvidia-l4` visible |
| Regional `NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |
| Regional `PREEMPTIBLE_NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |
| Project-wide `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` |
| Project-wide `CPUS_ALL_REGIONS` quota | limit `32`, usage `0` |
| Proof service account | `reeditpro-ai-broll-proof-sa` present |
| IAP SSH firewall | `reeditpro-ai-broll-proof-iap-ssh` enabled, TCP 22 from `35.235.240.0/20` to tag `ai-video-broll-wan-l4-proof` |

## Reservation Create Attempt

The approved reservation create attempt targeted:

- Reservation name: `reeditpro-qwen2-5-vl-l4-proof-reservation`
- Zone: `us-east4-a`
- VM count: `1`
- Machine type: `g2-standard-8`
- GPU: one `nvidia-l4`
- Reservation sharing policy: `DISALLOW_ALL`
- Specific reservation required: true
- VM creation in this gate: false
- Inference in this gate: false
- Serving in this gate: false

The sanitized Google Cloud result was:

```text
ZONE_RESOURCE_POOL_EXHAUSTED
g2-standard-8 with 1 nvidia-l4 accelerator is currently unavailable in us-east4-a.
reason: gpu_availability
zonesAvailable: none returned
```

No token, credential, service-account key, environment value, connection string, or secret was printed.

## Post-attempt Resource Check

After the blocked reservation create attempt:

| Resource | Result |
| --- | --- |
| Reservation `reeditpro-qwen2-5-vl-l4-proof-reservation` in `us-east4-a` | absent |
| Instance `reeditpro-qwen2-5-vl-l4-proof` in `us-east4-a` | absent |
| Disk `reeditpro-qwen2-5-vl-l4-proof` in `us-east4-a` | absent |
| Address `reeditpro-qwen2-5-vl-l4-proof` in `us-east4` | absent |
| Active reservations after attempt | none |
| Regional `NVIDIA_L4_GPUS` usage after attempt | `0` |
| Project-wide `GPUS_ALL_REGIONS` usage after attempt | `0` |
| Cleanup required | false |
| Cleanup verified | true |

## Capacity Outcome

The Qwen2.5-VL L4 proof path now has clean evidence that all bounded `g2-standard-8` reservation-create attempts failed at GPU availability before resource creation:

| Attempt | Zone | Result |
| --- | --- | --- |
| Initial reservation create | `us-east1-b` | GPU availability stockout |
| Capacity follow-up target | `us-west4-a` | GPU availability stockout |
| Fallback target | `us-west4-c` | GPU availability stockout |
| Remaining exact-shape target | `us-east1-c` | GPU availability stockout |
| GCP-suggested retry | `us-east1-b` | GPU availability stockout |
| Capacity remediation target | `us-east4-a` | GPU availability stockout |

The next step should not be an always-on GPU or long-held reservation. The user requirement is now explicit: Qwen GPU runtime must run only when it is being used and stop or scale to zero when idle.

## Cost-friendly Runtime Direction

Recommended next direction:

- keep NVIDIA L4 as the selected cost/performance GPU for Qwen2.5-VL 7B;
- preserve the current private model cache and Linux L4 wheelhouse;
- define an on-demand GPU lifecycle instead of an always-on service;
- Preferred path: Cloud Run GPU scale-to-zero review if the Qwen container, model-cache, cold-start, and region quota constraints pass a future review;
- Fallback path: ephemeral Compute Engine L4 worker VM with explicit idle teardown if Cloud Run GPU is not suitable for Qwen2.5-VL 7B;
- require approval, queue/job ownership, idempotency, cost cap, and cleanup evidence before any runtime proof;
- run no inference until a future bounded proof explicitly authorizes it.

## Outcome

- reservation create command attempted: true
- blocked by quota: false
- blocked by GPU availability: true
- reservation created: false
- reservation deleted: false
- VM created: false
- IAP transfer run: false
- SSH session opened: false
- remote dependency install run: false
- L4 CUDA visibility proof attempted: false
- vLLM GPU import proof attempted: false
- metadata loader proof repeated on L4: false
- model import run: false
- model inference run: false
- cleanup verified: true

## Runtime Gates

- `gcpReadOnlyCommandsExecuted=true`
- `gcpMutatingCommandsExecuted=true`
- `reservationCreateCommandAttempted=true`
- `blockedByReservationGpuAvailability=true`
- `blockedByQuota=false`
- `reservationCreated=false`
- `reservationDeleted=false`
- `vmCreated=false`
- `diskCreated=false`
- `externalIpCreated=false`
- `networkChanged=false`
- `serviceAccountCreated=false`
- `serviceAccountKeyCreated=false`
- `firewallRuleCreated=false`
- `bucketCreated=false`
- `artifactRegistryImageCreated=false`
- `cloudRunServiceCreated=false`
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

`QWEN2_5_VL_STACK_TOOL_10-IDLE-GPU-LIFECYCLE: define on-demand L4 GPU lifecycle so Qwen runs only when queued and stops when idle`
