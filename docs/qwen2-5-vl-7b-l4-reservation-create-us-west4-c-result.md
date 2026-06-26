# Qwen2.5-VL 7B L4 Reservation Create US West4 C Result

## Status

Decision: `qwen2_5_vl_7b_l4_reservation_create_us_west4_c_blocked_by_gpu_availability_no_vm_no_inference`

This packet records the bounded Qwen2.5-VL L4 reservation-create gate in `us-west4-c`.

The gate repeated the safety preflight, then attempted exactly one approved specific reservation for `g2-standard-8` plus one NVIDIA L4 in `us-west4-c`. Google Cloud rejected the reservation create before a reservation existed because the zone did not have enough GPU capacity for the requested shape.

No reservation, VM, disk, external IP, address, SSH session, IAP transfer, dependency install on VM, CUDA proof, vLLM import proof, model import, model inference, generated media, provider call, worker dispatch, Supabase mutation, SQL, public artifact, signed URL, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim was created.

## Source Evidence

- `us-west4-a` reservation create result: `docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-a-result.md`
- Capacity follow-up: `docs/qwen2-5-vl-7b-l4-reservation-capacity-followup-result.md`
- Previous reservation create result: `docs/qwen2-5-vl-7b-l4-reservation-create-result.md`
- Reservation approval: `docs/qwen2-5-vl-7b-l4-reservation-approval-result.md`
- Proof identity and IAP firewall evidence: `docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md`
- Private wheelhouse import proof: `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`

## Safety Preflight

The following preflight checks passed before the reservation-create attempt:

| Area | Result |
| --- | --- |
| Git branch | `codex/qwen2-5-vl-7b-l4-reservation-create-us-west4-c` |
| Tracked worktree before attempt | clean |
| Active project | `reeditpro` |
| Active account | present |
| Target zone | `us-west4-c` |
| Target reservation before create | absent |
| Exact proof VM before create | absent |
| Exact proof disk before create | absent |
| Exact proof address before create | absent |
| Machine type | `g2-standard-8` visible |
| Accelerator | `nvidia-l4` visible |
| Regional `NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |
| Regional `PREEMPTIBLE_NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |
| Project-wide `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` |
| Project-wide `CPUS_ALL_REGIONS` quota | limit `32`, usage `0` |
| Proof service account | present |
| IAP SSH firewall | enabled, TCP 22 from `35.235.240.0/20` to tag `ai-video-broll-wan-l4-proof` |

## Reservation Create Attempt

The approved reservation create attempt targeted:

- Reservation name: `reeditpro-qwen2-5-vl-l4-proof-reservation`
- Zone: `us-west4-c`
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
g2-standard-8 with 1 nvidia-l4 accelerator is currently unavailable in us-west4-c.
reason: gpu_availability
```

No token, credential, service-account key, environment value, connection string, or secret was printed.

## Post-attempt Resource Check

After the blocked reservation create attempt:

| Resource | Result |
| --- | --- |
| Reservation `reeditpro-qwen2-5-vl-l4-proof-reservation` in `us-west4-c` | absent |
| Instance `reeditpro-qwen2-5-vl-l4-proof` in `us-west4-c` | absent |
| Disk `reeditpro-qwen2-5-vl-l4-proof` in `us-west4-c` | absent |
| Address `reeditpro-qwen2-5-vl-l4-proof` in `us-west4` | absent |
| Regional `NVIDIA_L4_GPUS` usage after attempt | `0` |
| Project-wide `GPUS_ALL_REGIONS` usage after attempt | `0` |
| Cleanup required | false |
| Cleanup verified | true |

## Fallback Check

The remaining target `us-east1-c` was checked read-only after the blocked attempt:

| Area | Result |
| --- | --- |
| `g2-standard-8` in `us-east1-c` | visible |
| `nvidia-l4` in `us-east1-c` | visible |
| Matching reservation in `us-east1-c` | absent |
| Matching proof VM in `us-east1-c` | absent |

## Outcome

- reservation create command attempted: true
- blocked by quota: false
- blocked by GPU availability: true
- reservation created: false
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

The next bounded attempt should target `us-east1-c`, one of the remaining exact-shape zones identified in the capacity review. It must repeat all resource and quota checks before mutation.

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

`QWEN2_5_VL_STACK_TOOL_9-RESERVATION-CREATE-US-EAST1-C: create bounded L4 reservation for Qwen proof in us-east1-c, no VM/no inference`
