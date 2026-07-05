import fs from 'node:fs'
import path from 'node:path'
import {
  evaluateAiGraphicsOnDemandRuntimeAdmission,
  type AiGraphicsOnDemandRuntimeAdmission,
} from '../tool-registry/ai-graphics-on-demand-runtime-admission'
import type {
  AiGraphicsCanonicalToolId,
  AiGraphicsCapabilityId,
} from '../tool-registry/ai-graphics-tool-call-readiness'

const decision =
  'ai_graphics_on_demand_runtime_admission_private_proof_ref_smoke_passed'

const jsonOut =
  'docs/tool-intelligence/ai-graphics/on-demand-runtime-admission-private-proof-ref-smoke.json'
const markdownOut =
  'docs/tool-intelligence/ai-graphics/on-demand-runtime-admission-private-proof-ref-smoke.md'

const gpuModelTools: Array<{
  toolId: AiGraphicsCanonicalToolId
  capabilityId: AiGraphicsCapabilityId
  modelWeightManifestRequired: boolean
}> = [
  { toolId: 'torch_torchvision', capabilityId: 'model_runtime_foundation', modelWeightManifestRequired: false },
  { toolId: 'transformers', capabilityId: 'model_runtime_foundation', modelWeightManifestRequired: false },
  { toolId: 'sam2', capabilityId: 'subject_segmentation', modelWeightManifestRequired: true },
  { toolId: 'birefnet', capabilityId: 'background_removal', modelWeightManifestRequired: true },
  { toolId: 'real_esrgan', capabilityId: 'upscaling', modelWeightManifestRequired: true },
  { toolId: 'kornia', capabilityId: 'tensor_image_ops', modelWeightManifestRequired: false },
  { toolId: 'rembg', capabilityId: 'background_removal', modelWeightManifestRequired: true },
  { toolId: 'transparent_background', capabilityId: 'background_removal', modelWeightManifestRequired: true },
]

function baseInput(tool: (typeof gpuModelTools)[number]) {
  return {
    capabilityId: tool.capabilityId,
    requestedToolId: tool.toolId,
    executionRequested: true,
    approvedPlanSnapshotId: `approved-snapshot-${tool.toolId}`,
    creditReservationId: `credit-reservation-${tool.toolId}`,
    artifactBoundaryApprovalRef: `private://ai-graphics/runtime-admission/${tool.toolId}/artifact-boundary`,
    toolRouteApprovalRef: `private://ai-graphics/runtime-admission/${tool.toolId}/tool-route`,
    workerApprovalRef: `private://ai-graphics/runtime-admission/${tool.toolId}/worker`,
    runtimeEnqueueApprovalRef: `private://ai-graphics/runtime-admission/${tool.toolId}/runtime-enqueue`,
    ownerRuntimeApprovalRef: `private://ai-graphics/runtime-admission/${tool.toolId}/owner-runtime`,
    privateArtifactManifestRef: `private://ai-graphics/runtime-admission/${tool.toolId}/artifact-manifest.json`,
  }
}

function invalidAdmission(tool: (typeof gpuModelTools)[number]): AiGraphicsOnDemandRuntimeAdmission {
  return evaluateAiGraphicsOnDemandRuntimeAdmission({
    ...baseInput(tool),
    nativeGpuRuntimeProofRef: `https://public.example.invalid/ai-graphics/${tool.toolId}/gpu-proof.json?signature=fake`,
    modelWeightManifestRef: tool.modelWeightManifestRequired
      ? `external-beta-runtime://model-manifests/${tool.toolId}.json`
      : undefined,
  })
}

function acceptedAdmission(tool: (typeof gpuModelTools)[number]): AiGraphicsOnDemandRuntimeAdmission {
  return evaluateAiGraphicsOnDemandRuntimeAdmission({
    ...baseInput(tool),
    nativeGpuRuntimeProofRef: `private://ai-graphics/runtime-admission/${tool.toolId}/native-gpu-proof.json`,
    modelWeightManifestRef: tool.modelWeightManifestRequired
      ? `private://ai-graphics/runtime-admission/${tool.toolId}/model-weight-manifest.json`
      : undefined,
  })
}

const rejectedPublicProofRefCases = gpuModelTools.map((tool) => {
  const admission = invalidAdmission(tool)
  return {
    toolId: tool.toolId,
    capabilityId: tool.capabilityId,
    modelWeightManifestRequired: tool.modelWeightManifestRequired,
    decision: admission.decision,
    runtimeJobAdmissionReadyWithProvidedEvidence:
      admission.runtimeJobAdmissionReadyWithProvidedEvidence,
    gpuRuntimeStartAllowedForAcceptedJob: admission.gpuRuntimeStartAllowedForAcceptedJob,
    gpuRuntimeShouldStartNow: admission.gpuRuntimeShouldStartNow,
    gpuRuntimePerformed: admission.gpuRuntimePerformed,
    missingRuntimeProofGates: admission.missingRuntimeProofGates,
  }
})

const acceptedPrivateProofRefCases = gpuModelTools.map((tool) => {
  const admission = acceptedAdmission(tool)
  return {
    toolId: tool.toolId,
    capabilityId: tool.capabilityId,
    modelWeightManifestRequired: tool.modelWeightManifestRequired,
    decision: admission.decision,
    runtimeJobAdmissionReadyWithProvidedEvidence:
      admission.runtimeJobAdmissionReadyWithProvidedEvidence,
    gpuRuntimeStartupAuthorization: admission.gpuRuntimeStartupAuthorization,
    gpuRuntimeStartAllowedForAcceptedJob: admission.gpuRuntimeStartAllowedForAcceptedJob,
    gpuRuntimeShouldStartNow: admission.gpuRuntimeShouldStartNow,
    gpuRuntimePerformed: admission.gpuRuntimePerformed,
    agentCanExecuteToolsNow: admission.booleans.agentCanExecuteToolsNow,
    routeExecutionApprovedNow: admission.booleans.routeExecutionApprovedNow,
    workerExecutionApprovedNow: admission.booleans.workerExecutionApprovedNow,
    toolExecutionApprovedNow: admission.booleans.toolExecutionApprovedNow,
    gpuRuntimeApprovedNow: admission.booleans.gpuRuntimeApprovedNow,
    externalBetaReadyNow: admission.booleans.externalBetaReadyNow,
    productionReadyNow: admission.booleans.productionReadyNow,
  }
})

const failures = [
  ...rejectedPublicProofRefCases.flatMap((record) => [
    record.decision !== 'runtime_job_blocked'
      ? `${record.toolId}:public_ref_not_blocked`
      : undefined,
    record.runtimeJobAdmissionReadyWithProvidedEvidence
      ? `${record.toolId}:public_ref_ready`
      : undefined,
    record.gpuRuntimeStartAllowedForAcceptedJob
      ? `${record.toolId}:public_ref_gpu_start_allowed`
      : undefined,
    record.gpuRuntimeShouldStartNow ? `${record.toolId}:public_ref_gpu_started` : undefined,
    record.gpuRuntimePerformed ? `${record.toolId}:public_ref_gpu_performed` : undefined,
    !record.missingRuntimeProofGates.some((gate) => gate.includes('not private-scoped'))
      ? `${record.toolId}:public_ref_missing_private_scope_gate`
      : undefined,
  ]),
  ...acceptedPrivateProofRefCases.flatMap((record) => [
    record.decision !== 'runtime_job_admission_ready_for_worker_enqueue'
      ? `${record.toolId}:private_ref_not_admission_ready`
      : undefined,
    !record.runtimeJobAdmissionReadyWithProvidedEvidence
      ? `${record.toolId}:private_ref_not_ready`
      : undefined,
    record.gpuRuntimeStartupAuthorization !== 'on_demand_start_allowed_after_live_worker_enqueue'
      ? `${record.toolId}:private_ref_not_on_demand_authorized`
      : undefined,
    !record.gpuRuntimeStartAllowedForAcceptedJob
      ? `${record.toolId}:private_ref_gpu_start_not_allowed_for_accepted_job`
      : undefined,
    record.gpuRuntimeShouldStartNow ? `${record.toolId}:private_ref_gpu_started_now` : undefined,
    record.gpuRuntimePerformed ? `${record.toolId}:private_ref_gpu_performed` : undefined,
    record.agentCanExecuteToolsNow ? `${record.toolId}:agent_execute_enabled` : undefined,
    record.routeExecutionApprovedNow ? `${record.toolId}:route_execution_enabled` : undefined,
    record.workerExecutionApprovedNow ? `${record.toolId}:worker_execution_enabled` : undefined,
    record.toolExecutionApprovedNow ? `${record.toolId}:tool_execution_enabled` : undefined,
    record.gpuRuntimeApprovedNow ? `${record.toolId}:gpu_runtime_approved_now` : undefined,
    record.externalBetaReadyNow ? `${record.toolId}:external_beta_ready_now` : undefined,
    record.productionReadyNow ? `${record.toolId}:production_ready_now` : undefined,
  ]),
].filter((failure): failure is string => Boolean(failure))

const packet = {
  schemaVersion:
    '2026-07-02.ai-graphics.on-demand-runtime-admission-private-proof-ref-smoke',
  decision,
  branch: 'codex/rp-ai-graphics-tool-call-readiness-contract',
  sourcePacket: 'docs/tool-intelligence/ai-graphics/on-demand-runtime-admission.json',
  sourceModule: 'server/tool-registry/ai-graphics-on-demand-runtime-admission.ts',
  summary:
    'Executable smoke for the on-demand runtime admission proof-ref boundary. It proves the eight GPU/model tools reject public or non-private runtime proof references and accept only private proof refs for future worker-enqueue admission, while keeping GPU start, tool execution, route execution, beta, and production gates false.',
  counts: {
    totalAiGraphicsTools: 21,
    gpuModelToolsCovered: gpuModelTools.length,
    rejectedPublicProofRefCases: rejectedPublicProofRefCases.length,
    acceptedPrivateProofRefCases: acceptedPrivateProofRefCases.length,
    runtimeJobAdmissionReadyWithPrivateRefs: acceptedPrivateProofRefCases.filter(
      (record) => record.runtimeJobAdmissionReadyWithProvidedEvidence,
    ).length,
    publicProofRefsRejected: rejectedPublicProofRefCases.filter(
      (record) => record.decision === 'runtime_job_blocked',
    ).length,
    gpuRuntimeStartedNow: acceptedPrivateProofRefCases.filter(
      (record) => record.gpuRuntimeShouldStartNow,
    ).length,
    gpuRuntimePerformed: acceptedPrivateProofRefCases.filter(
      (record) => record.gpuRuntimePerformed,
    ).length,
    agentExecutableNow: acceptedPrivateProofRefCases.filter(
      (record) => record.agentCanExecuteToolsNow,
    ).length,
  },
  gpuModelTools: gpuModelTools.map((tool) => tool.toolId),
  rejectedPublicProofRefCases,
  acceptedPrivateProofRefCases,
  booleans: {
    privateProofRefSmokePassed: failures.length === 0,
    all8GpuModelToolsCovered: gpuModelTools.length === 8,
    publicProofRefsRejected: rejectedPublicProofRefCases.every(
      (record) => record.decision === 'runtime_job_blocked',
    ),
    privateProofRefsAcceptedForFutureWorkerEnqueue: acceptedPrivateProofRefCases.every(
      (record) => record.runtimeJobAdmissionReadyWithProvidedEvidence,
    ),
    agentCanSelectForPlanning: true,
    gpuRuntimeOnDemandOnly: true,
    noIdleGpuRuntimeApproved: true,
    gpuStartsOnlyForApprovedWorkerOrToolCall: true,
    agentCanExecuteToolsNow: false,
    routeExecutionApprovedNow: false,
    workerExecutionApprovedNow: false,
    toolExecutionApprovedNow: false,
    gpuRuntimeApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
    gpuRuntimePerformed: false,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}

if (failures.length > 0) {
  console.error('AI graphics private proof-ref smoke failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

fs.mkdirSync(path.dirname(jsonOut), { recursive: true })
fs.writeFileSync(`${jsonOut}.tmp`, `${JSON.stringify(packet, null, 2)}\n`)
fs.renameSync(`${jsonOut}.tmp`, jsonOut)

const markdown = `# AI Graphics On-Demand Runtime Admission Private Proof Ref Smoke

Decision: \`${decision}\`

This executable smoke closes the lower-level runtime admission gap for the eight GPU/model tools. Public, signed, or non-private proof references are rejected. Only \`private://\` native GPU runtime proof refs, and \`private://\` model-weight manifest refs where required, can make a future worker-enqueue admission ready.

## Counts

- GPU/model tools covered: \`${packet.counts.gpuModelToolsCovered}\`
- Public/non-private proof-ref cases rejected: \`${packet.counts.publicProofRefsRejected}\`
- Private proof-ref future worker-enqueue admissions: \`${packet.counts.runtimeJobAdmissionReadyWithPrivateRefs}\`
- GPU runtime started now: \`${packet.counts.gpuRuntimeStartedNow}\`
- Agent executable now: \`${packet.counts.agentExecutableNow}\`

## Tools

${gpuModelTools.map((tool) => `- \`${tool.toolId}\``).join('\n')}

## Runtime Boundary

- \`agentCanSelectForPlanning=true\`
- \`agentCanExecuteToolsNow=false\`
- \`routeExecutionApprovedNow=false\`
- \`workerExecutionApprovedNow=false\`
- \`toolExecutionApprovedNow=false\`
- \`gpuRuntimeShouldStartNow=false\`
- \`gpuRuntimePerformed=false\`
- \`externalBetaReadyNow=false\`
- \`productionReadyNow=false\`

Private proof refs allow only future worker-enqueue admission. They do not start GPU by themselves; GPU remains on demand only and starts only for an accepted worker/tool-call job.
`

fs.writeFileSync(`${markdownOut}.tmp`, markdown)
fs.renameSync(`${markdownOut}.tmp`, markdownOut)

console.log(JSON.stringify({
  status: 'passed',
  decision,
  gpuModelToolsCovered: packet.counts.gpuModelToolsCovered,
  publicProofRefsRejected: packet.counts.publicProofRefsRejected,
  privateProofRefAdmissionsReady: packet.counts.runtimeJobAdmissionReadyWithPrivateRefs,
  gpuRuntimeShouldStartNow: packet.booleans.gpuRuntimeShouldStartNow,
}, null, 2))
