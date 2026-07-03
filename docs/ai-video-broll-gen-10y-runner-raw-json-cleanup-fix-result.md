# AI-VIDEO-BROLL-GEN-10Y Runner Raw JSON Cleanup Fix Result

Status: `runner_fix_applied_no_execution`

Decision: `ai_video_broll_gen_10y_runner_raw_json_cleanup_fix_applied_no_execution_10z_retry_ready`

This result fixes the 10X runner failure mode in source control. It does not create a VM, open SSH, transfer payloads, install dependencies, import Wan/Wan2.1, run inference, create generated video, create generated assets, run Docker, mutate Supabase, execute SQL, call providers, dispatch workers, mutate credits, unlock beta/production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## What Failed In 10X

10X created the prompt-scoped no-public-IP L4 VM `reeditpro-ai-broll-wan-l4-proof`, but the local lifecycle runner failed before IAP lookup readiness, payload transfer, dependency install, model import, or inference.

The failure was not a GPU capacity failure and not a model failure. The failure was local runner logic:

- The runner parsed sanitized/truncated `describe` output instead of raw command stdout.
- The sanitized `stdoutSummary` was a log summary, not source-of-truth machine JSON.
- Cleanup state depended too much on the parsed describe result.
- Exact-name manual cleanup repaired the prompt-scoped VM and independent absence checks verified instance, disk, address, and reservation were absent.
- A separate shell detail was also captured: zsh treats unquoted `--format=value(name,status)` badly; future runner commands use argv arrays so shell quoting does not decide correctness.

## Fix Applied

Added source-controlled runner contract:

`server/cli/ai-video-broll-gen-10y-l4-payload-install-runner-contract.ts`

The contract is no-execution by default. Running or importing it does not call `gcloud`, create a VM, open SSH, transfer data, install packages, or run model work.

It records the future 10Z behavior:

- Parse raw command stdout before sanitizing or truncating summaries.
- Treat `stdoutSummary` and `stderrSummary` as log-only.
- Never make machine-state decisions from sanitized summaries.
- Use compact post-create describe shape: `json(status,networkInterfaces,disks)`.
- Represent `value(name,status)` as argv, not an unquoted shell string.
- Attempt exact-name delete after any create attempt or successful create result.
- Keep cleanup independent of describe parsing.
- Verify exact-name absence for instance, disk, address, and reservation.
- Require durable summaries that record every phase and final cleanup state.

## Future Runner Contract Checks

The future 10Z runner must preserve these checks before it may create a prompt-scoped VM:

| Area | Required behavior |
| --- | --- |
| Raw parse | Parse raw stdout first, then sanitize logs. |
| Summary use | `stdoutSummary` and `stderrSummary` are log-only. |
| Compact describe | Use compact instance JSON for status, network interfaces, and disks. |
| Public IP | Recheck no public NAT IP after create. |
| Boot disk | Recheck boot disk `autoDelete=true`. |
| Cleanup trigger | Delete exact prompt VM after any create attempt or successful create result. |
| Cleanup verification | Verify exact-name absence for instance, disk, address, and reservation. |
| Durable summary | Record every phase and final cleanup state. |

## What To Do Next Time

Before another L4 runtime retry:

1. Run the 10Y smoke.
2. Run the existing B-roll quota/cache/gate smokes.
3. Confirm there is no pre-existing prompt VM, disk, address, or reservation.
4. Use the source-controlled runner contract instead of a temporary heredoc.
5. Parse raw JSON from `gcloud` before producing sanitized summaries.
6. Cleanup by exact prompt name even when describe parsing fails.
7. Verify absence after cleanup with exact-name checks.

This is how we prevent the same failure from repeating.

## Runtime Side Effects

All 10Y runtime side effects are false:

- `gcpReadOnlyCommandsExecuted=false`
- `gcpMutatingCommandsExecuted=false`
- `computeVmCreated=false`
- `computeVmDeleted=false`
- `sshSessionOpened=false`
- `iapTransferExecuted=false`
- `fullWheelhousePayloadTransferred=false`
- `dependencyInstalledOnVm=false`
- `modelImportRun=false`
- `modelInferenceRun=false`
- `generatedVideoCreated=false`
- `generatedAssetsCreated=false`
- `dockerRun=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `storageObjectsCreated=false`
- `signedUrlsCreated=false`
- `publicArtifactsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Updated Active Blocker

10Y fixes the runner contract. The active B-roll blocker now moves to the bounded runtime retry prompt:

`broll_10z_no_idle_l4_payload_install_retry_after_runner_fix_required`

## Recommended Next Prompt

`AI-VIDEO-BROLL-GEN-10Z-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-AFTER-RUNNER-FIX: retry bounded no-idle L4 payload/install readiness after raw JSON cleanup runner fix, no model import/no inference`
