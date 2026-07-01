# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Approved-Fixture Private Inference Gate Alignment

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_gate_alignment_accepted_explicit_tool_prompt_required`.

This packet aligns the external-agent execution gate with the approved bounded Qwen private inference retry envelope. It does not run the retry. It does not invoke Cloud Run, execute a Cloud Run job, resolve a service target, resolve an audience, fetch an identity token, create an auth header, send a private request, import Qwen, load Qwen, initialize vLLM, process a prompt, run a forward pass, run inference, persist model output, mutate Supabase, execute SQL, write storage objects, create signed URLs, create public artifacts, create generated assets, process media, render/export, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

The upstream 58DU result proved that the retry attempt should not be run while the global external-agent gate still reports Qwen as blocked. This alignment narrows that mismatch: the gate may now report Qwen as ready only for a future explicit 58DW bounded execution prompt. It still does not authorize raw chat execution, unbounded worker dispatch, generated assets, storage writes, signed URLs, public artifacts, credit mutation, beta, production, or broad user-facing dispatch.

## Reviewed Evidence

- 58DU retry attempt result: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-result.md`
- 58DT retry attempt approval: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval.md`
- retry gate: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate.md`
- retry plan: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.md`
- external-agent execution gate: `src/backend/mock/mock-external-agent-tool-execution-gate.ts`
- external-agent readiness rollup: `src/backend/mock/mock-external-agent-tool-execution-readiness-rollup.ts`
- model routing policy: `model-routing-policy.md`
- intent-led edit planning: `intent-led-edit-planning.md`

## Alignment Outcome

- 58DU retry attempt result recorded: true
- fail-closed mismatch identified: true
- external-agent gate aligned for future bounded Qwen retry prompt: true
- Qwen may be marked ready for explicit tool gate: true
- direct runtime action from this packet allowed: false
- explicit tool-specific bounded execution prompt required before runtime: true
- raw chat execution allowed: false
- generated assets allowed: false
- Supabase mutation allowed: false
- storage writes allowed: false
- signed URLs allowed: false
- public artifacts allowed: false
- credit mutation allowed: false
- beta/production unlock allowed: false
- `generatedLocalFixturePassedClaimed=false`

## External-Agent Gate Alignment Rules

- Qwen can become the only ready external-agent tool lane when the static gate is evaluated.
- A `--require-go` pass means only that the next prompt may be the tool-specific bounded 58DW execution prompt.
- A `--require-go` pass does not itself run Cloud Run, a job, a model import, model load, prompt processing, forward pass, or inference.
- The 58DW prompt must repeat live auth/service/job checks before runtime.
- The 58DW prompt must execute at most one approved-fixture private retry through the persisted job and lease bridge.
- The 58DW prompt must keep generated assets, storage writes, signed URLs, public artifacts, Supabase mutation, credit mutation, beta, and production blocked.
- B-roll remains independently quota-blocked and is not made execution-ready by this Qwen alignment.

## Source-Of-Truth Rules

- workers execute approved snapshots, not raw chat: true
- structured tool envelope required before execution: true
- raw chat worker execution allowed: false
- raw worker prompt allowed: false
- signed URL source of truth allowed: false
- public URL source of truth allowed: false
- browser-facing invocation allowed: false
- Qwen may generate B-roll video: false
- Qwen may render/export: false

## Runtime Flags

- `externalAgentGateAlignmentRecorded=true`
- `qwenReadyForExplicitToolGate=true`
- `requiresToolSpecificBoundedExecutionPrompt=true`
- `runtimeRunNow=false`
- `cloudRunInvocationAttempted=false`
- `cloudRunJobExecuted=false`
- `serviceRuntimeRequestSent=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `promptProcessed=false`
- `forwardPassRun=false`
- `inferenceRun=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Advances

This advances Qwen from `retry_attempt_result_blocked_by_fail_closed_external_agent_gate` to `gate_alignment_accepted_explicit_tool_prompt_required`. It prepares the static external-agent gate to say Qwen is ready for the next bounded execution prompt, without running that execution now.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DW-PRIVATE-INFERENCE-BOUNDED-RETRY-PROMPT: run one bounded approved-fixture private inference retry through the persisted job and lease bridge, no generated assets/no mutation`
