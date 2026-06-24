# Implementation Prompt: AI Graphics Runtime Boundary Handoff Owner Approval

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_handoff_owner_approved_with_warnings`

Implement the docs/diagnostics-only owner-approval lane from `origin/codex/rp-ai-graphics-canonical-agent-selection-runtime-boundary-handoff-owner-review` on branch `codex/rp-ai-graphics-canonical-agent-selection-runtime-boundary-handoff-owner-approval` with draft PR title `[tools] AI graphics canonical agent selection runtime boundary handoff owner approval`.

## Source State

- PR #722: OPEN/draft=true/mergeable=MERGEABLE at `c97952a2b30a3580964b0aab3bb711dc85ded8a4`
- PR #719: OPEN/draft=true/mergeable=MERGEABLE at `fa62444977d7ab6e4f40095ac489ccfc5108e254`
- PR #718: OPEN/draft=true/mergeable=MERGEABLE at `d291277d68a5bf5e3bc076acd99cd1a0b3bd64a3`
- PR #715: OPEN/draft=true/mergeable=MERGEABLE at `9ff65730f9a88041e9f0d2f1b8f273711bef1a1e`
- PR #714: OPEN/draft=true/mergeable=MERGEABLE at `9ee8d5aee571b130360a4df20bd0a14bd93ec600`
- PR #710: OPEN/draft=true/mergeable=MERGEABLE at `48a9537c870a936b56c4861edcfdc7c5a189e0b6`
- PR #709: OPEN/draft=true/mergeable=MERGEABLE at `f01090f7f22d27ff8bde8bec8202c806f26a1637`
- PR #705: OPEN/draft=true/mergeable=MERGEABLE at `73ffd8a071468facbb9366a5ed0dbe706691c38c`

Duplicate search result: Preflight found no exact runtime-boundary handoff owner-approval PR, remote branch, or worktree.

## Required Outputs

- Owner-approval docs and JSON records under `docs/tool-intelligence/ai-graphics/`.
- Per-capability owner-approval docs under `docs/tool-intelligence/ai-graphics/canonical-agent-selection/runtime-boundary-handoff-owner-approval/`.
- Node built-ins diagnostic: `scripts/validation/ai-graphics-canonical-agent-selection-runtime-boundary-handoff-owner-approval-diagnostics.mjs`.
- Package script: `ai-graphics:canonical-agent-selection:runtime-boundary-handoff-owner-approval-diagnostics`.

## Required Booleans

- `canonicalAgentSelectionRuntimeBoundaryHandoffOwnerApprovalCompleted`: true
- `sourceRuntimeBoundaryHandoffOwnerReviewAccepted`: true
- `sourceRuntimeBoundaryHandoffQaAccepted`: true
- `sourceRuntimeBoundaryHandoffReviewAccepted`: true
- `sourceRuntimeBoundaryCanonicalizationOwnerApprovalQaAccepted`: true
- `all21ToolsCoveredByRuntimeBoundaryHandoffOwnerApproval`: true
- `allRequiredCapabilitiesCoveredByRuntimeBoundaryHandoffOwnerApproval`: true
- `allRuntimeBucketsCoveredByRuntimeBoundaryHandoffOwnerApproval`: true
- `handoffSchemaOwnerApproved`: true
- `handoffContractOwnerApproved`: true
- `handoffToolMapOwnerApproved`: true
- `handoffCapabilityMapOwnerApproved`: true
- `handoffProofStatusOwnerApproved`: true
- `handoffMissingProofOwnerApproved`: true
- `handoffPlanningOnlyPolicyOwnerApproved`: true
- `handoffBlockedUseRegisterOwnerApproved`: true
- `toolRoutePlaceholderOwnerApproved`: true
- `workerPlaceholderOwnerApproved`: true
- `agentCanSelectForPlanning`: true
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: false
- `workerExecutionApprovedNow`: false
- `toolExecutionApprovedNow`: false
- `browserWebglCanvasRuntimeApprovedNow`: false
- `gpuRuntimeApprovedNow`: false
- `providerRuntimeApprovedNow`: false
- `publicArtifactApprovedNow`: false
- `signedUrlApprovedNow`: false
- `runtimeReadyNow`: false
- `internalBetaReadyNow`: false
- `productionReadyNow`: false
- `dependencyInstallPerformed`: false
- `packageLockMutationPerformed`: false
- `toolExecutionPerformed`: false
- `workerExecutionPerformed`: false
- `routeExecutionPerformed`: false
- `providerRuntimePerformed`: false
- `browserWebglCanvasRuntimePerformed`: false
- `gpuRuntimePerformed`: false
- `supabaseMutationPerformed`: false
- `gcsUploadPerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false

## No-Scope

No dependency install, package-lock mutation, CPU/static validation rerun, import smoke, synthetic fixtures, tool/worker/route/provider execution, browser/WebGL/canvas runtime, GPU/model runtime, model downloads, media processing, Supabase/SQL/GCS, signed URLs, public artifacts, beta/production commands, PR merge, PR close, or PR retarget.

## Draft PR Metadata

- Draft PR: Pending creation.
- Draft status: Pending creation.
- Head SHA: Pending creation.
- Check rollup: Pending creation.
