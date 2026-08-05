import { z } from 'zod'

import type { EditSkillRuntime } from '../../core/edit-skill-runtime'
import type { EditSkillArtifactReference } from '../../core/edit-skill-artifact-store'
import {
  deepFreezeSkillValue,
  hashSkillValue,
} from '../../core/skill-capability-manifest-hash'
import { skillSha256Schema } from '../../core/skill-capability-manifest-schema'
import { trackGraphV2Schema } from '../../shared/track-graph'
import {
  TrackAllCanonicalPrivateExecutionCoordinator,
  type TrackAllCanonicalPrivateExecutionPackage,
  type TrackAllCanonicalPrivateExecutorRouter,
} from '../track-all-canonical-private-runtime'
import { TrackAllCanonicalPrivateCompositeOperationDriver } from './canonical-private-composite-operation-driver'
import { TrackAllCanonicalPrivateDeterministicOperationDriver } from './canonical-private-operation-driver'
import {
  TrackAllCanonicalPrivateSam31StageExecutor,
  compileTrackAllSam31ApprovedSessionPlanSet,
  type TrackAllCanonicalPrivateMaskletGeometryPort,
  type TrackAllSam31SessionAuthorityFactory,
} from './sam3_1-canonical-private-activation-bridge'
import {
  trackAllSam31PrivateCanaryReceiptSchema,
} from './sam3_1-private-canary'
import {
  TrackAllSam31RealPrivateSessionOwner,
  trackAllSam31RealPrivateSessionReceiptSchema,
} from './sam3_1-real-private-session-owner'

export const TRACK_ALL_SAM31_CANONICAL_PRIVATE_PUBLIC_E2E_RECEIPT_VERSION =
  'track_all_sam3_1_canonical_private_public_e2e_receipt_v1' as const

const e2eReceiptCoreSchema = z.object({
  schemaVersion: z.literal(
    TRACK_ALL_SAM31_CANONICAL_PRIVATE_PUBLIC_E2E_RECEIPT_VERSION,
  ),
  operationId: z.literal('tool.sam3_1.track_masklets.v2'),
  evidenceClass: z.literal('real_sam3_1_private_execution'),
  assignmentHash: skillSha256Schema,
  publicPlanHash: skillSha256Schema,
  pluginWorkGraphHash: skillSha256Schema,
  realCanaryReceiptHash: skillSha256Schema,
  finalSkillResultReceiptHash: skillSha256Schema,
  trackGraphV2Hash: skillSha256Schema,
  samSessionReceiptRefs: z.array(z.object({
    artifactType: z.literal(
      'track_all_sam3_1_real_private_session_receipt_v1',
    ),
    sha256: skillSha256Schema,
    byteLength: z.number().int().positive().safe(),
    ownerUserId: z.string().trim().min(1).max(180),
    workspaceId: z.string().trim().min(1).max(180),
    projectId: z.string().trim().min(1).max(180),
  }).strict()).length(1),
  samAttemptEvidenceRefs: z.array(z.object({
    artifactType: z.literal(
      'track_all_sam3_1_masklet_attempt_evidence_v2',
    ),
    sha256: skillSha256Schema,
    byteLength: z.number().int().positive().safe(),
    ownerUserId: z.string().trim().min(1).max(180),
    workspaceId: z.string().trim().min(1).max(180),
    projectId: z.string().trim().min(1).max(180),
  }).strict()).length(1),
  actualSamRequestCount: z.literal(1),
  actualGpuExecutionCount: z.literal(1),
  everySessionClosed: z.literal(true),
  targetQaObserved: z.literal(true),
  temporalQaObserved: z.literal(true),
  maskQaObserved: z.literal(true),
  publicPluginLifecycleObserved: z.literal(true),
  canonicalCoordinatorObserved: z.literal(true),
  injectedEvidenceUsed: z.literal(false),
  rawTensorDataPublished: z.literal(false),
  publicMaskArtifactCount: z.literal(0),
  productionMutationCount: z.literal(0),
  productionQualified: z.literal(false),
  completedAt: z.string().datetime({ offset: true }),
}).strict()

export const trackAllSam31CanonicalPrivatePublicE2EReceiptSchema =
  e2eReceiptCoreSchema.extend({ receiptHash: skillSha256Schema })
    .strict().superRefine((value, context) => {
      const { receiptHash, ...core } = value
      if (receiptHash !== hashSkillValue(core)) context.addIssue({
        code: 'custom',
        message: 'Canonical-private SAM public E2E receipt is stale or forged.',
      })
    })

export type TrackAllSam31CanonicalPrivatePublicE2EReceipt = z.infer<
  typeof trackAllSam31CanonicalPrivatePublicE2EReceiptSchema
>

/**
 * Gated real E2E entry point. The caller is the fixed backend owner and must
 * inject already-constructed canonical authorities; no model, checkpoint,
 * GPU, command, path, URL, retry, fallback, or price is accepted here.
 */
export async function executeTrackAllSam31CanonicalPrivatePublicE2E(input: {
  runtime: EditSkillRuntime
  executorRouter: TrackAllCanonicalPrivateExecutorRouter
  execution: TrackAllCanonicalPrivateExecutionPackage
  deterministicStageExecutor:
    TrackAllCanonicalPrivateDeterministicOperationDriver
  realSessionOwner: TrackAllSam31RealPrivateSessionOwner
  maskletGeometryPort: TrackAllCanonicalPrivateMaskletGeometryPort
  completedCanaryReceipt: unknown
  sessionPlanAuthority: {
    runtimeProfile: unknown
    routeGateReport: unknown
    approvedEstimateRef: {
      id: string
      version: number
      contentHash: string
    }
    accountEffectiveRateAuthorityRef: {
      id: string
      version: number
      contentHash: string
    }
    sessionAuthorityFactory: TrackAllSam31SessionAuthorityFactory
  }
  completedAt?: string
}): Promise<TrackAllSam31CanonicalPrivatePublicE2EReceipt> {
  const canary = trackAllSam31PrivateCanaryReceiptSchema.parse(
    input.completedCanaryReceipt,
  )
  const samItems = input.execution.pluginWorkGraph.atomicWorkItems.filter((item) =>
    item.operationId === 'tool.sam3_1.track_masklets.v2')
  const sessionPlanSetRefs = input.execution.initialArtifactRefs.filter((ref) =>
    ref.artifactType === 'track_all_sam3_1_approved_session_plan_set_v1')
  if (input.runtime.environmentClass !== 'canonical_private' ||
    !(input.deterministicStageExecutor instanceof
      TrackAllCanonicalPrivateDeterministicOperationDriver) ||
    !(input.realSessionOwner instanceof TrackAllSam31RealPrivateSessionOwner) ||
    input.maskletGeometryPort.evidenceClass !== 'real_private_masklets' ||
    canary.status !== 'completed' || canary.actualSamRequestCount !== 1 ||
    canary.actualGpuExecutionCount !== 1 || canary.injectedEvidenceUsed ||
    !input.execution.plan.samWorkPlanned ||
    input.execution.plan.objectBudget.sessionCount !== 1 ||
    samItems.length !== 1 || sessionPlanSetRefs.length !== 0 ||
    input.execution.assignment.authorizedRange.endFrameExclusive -
      input.execution.assignment.authorizedRange.startFrameInclusive > 240 ||
    input.execution.plan.requestedJobType !==
      'track_all.produce_selected_target_graph') {
    throw new Error('Canonical-private SAM E2E requires one exact canary-qualified selected-instance session.')
  }

  const exactInitialRef = (artifactType: string): EditSkillArtifactReference => {
    const refs = input.execution.initialArtifactRefs.filter((ref) =>
      ref.artifactType === artifactType)
    if (refs.length !== 1) throw new Error(
      `Canonical-private SAM E2E requires one exact ${artifactType} input.`,
    )
    return refs[0]!
  }
  const sourceArtifactRef = exactInitialRef('source_media_artifact_v1')
  const targetSpecificationRef = exactInitialRef(
    'track_all_target_specification_v1',
  )
  const targetSpecification = await input.runtime.artifactStore.readJson({
    reference: targetSpecificationRef,
    ownerUserId: input.execution.assignment.ownerUserId,
    workspaceId: input.execution.assignment.workspaceId,
    projectId: input.execution.assignment.projectId,
  })
  const sessionPlanSet = compileTrackAllSam31ApprovedSessionPlanSet({
    execution: input.execution,
    sourceArtifactRef,
    targetSpecification,
    runtimeProfile: input.sessionPlanAuthority.runtimeProfile,
    routeGateReport: input.sessionPlanAuthority.routeGateReport,
    approvedEstimateRef: input.sessionPlanAuthority.approvedEstimateRef,
    accountEffectiveRateAuthorityRef:
      input.sessionPlanAuthority.accountEffectiveRateAuthorityRef,
    sessionAuthorityFactory:
      input.sessionPlanAuthority.sessionAuthorityFactory,
  })
  if (sessionPlanSet.sessions.length !== 1) throw new Error(
    'Canonical-private SAM E2E session compiler exceeded its one-session canary authority.',
  )
  const sessionPlanSetRef = await input.runtime.artifactStore.putJson({
    artifactType: 'track_all_sam3_1_approved_session_plan_set_v1',
    value: sessionPlanSet,
    ownerUserId: input.execution.assignment.ownerUserId,
    workspaceId: input.execution.assignment.workspaceId,
    projectId: input.execution.assignment.projectId,
  })
  const execution = {
    ...input.execution,
    initialArtifactRefs: [
      ...input.execution.initialArtifactRefs,
      sessionPlanSetRef,
    ],
  }

  const samStageExecutor = new TrackAllCanonicalPrivateSam31StageExecutor({
    artifactStore: input.runtime.artifactStore,
    sessionOwner: input.realSessionOwner,
  })
  const operationDriver = new TrackAllCanonicalPrivateCompositeOperationDriver({
    artifactStore: input.runtime.artifactStore,
    deterministicStageExecutor: input.deterministicStageExecutor,
    sam31StageExecutor: samStageExecutor,
  })
  const coordinator = new TrackAllCanonicalPrivateExecutionCoordinator({
    runtime: input.runtime,
    executorRouter: input.executorRouter,
    operationDriver,
    execution,
  })
  const result = await coordinator.executeApprovedGraph()
  if (result.executionCounts.actualSamRequestCount !== 1 ||
    result.executionCounts.actualGpuExecutionCount !== 1 ||
    result.executionCounts.executionEvidenceClass !==
      'real_sam3_1_private_execution' ||
    result.executionCounts.samSessionReceiptRefs.length !== 1 ||
    result.executionCounts.samAttemptEvidenceRefs.length !== 1) {
    throw new Error('Canonical-private SAM E2E execution counts differ from its one-session authority.')
  }
  const scope = {
    ownerUserId: input.execution.assignment.ownerUserId,
    workspaceId: input.execution.assignment.workspaceId,
    projectId: input.execution.assignment.projectId,
  }
  const sessionReceipt = trackAllSam31RealPrivateSessionReceiptSchema.parse(
    await input.runtime.artifactStore.readJson({
      reference: result.executionCounts.samSessionReceiptRefs[0]!,
      ...scope,
    }),
  )
  if (!sessionReceipt.closeCompleted || sessionReceipt.injectedEvidenceUsed ||
    sessionReceipt.actualGpuExecutionCount !== 1) {
    throw new Error('Canonical-private SAM E2E lacks exact close or real inference evidence.')
  }
  const graphRefs = result.workItemResults.flatMap((workResult) =>
    workResult.outputArtifactRefs.filter((ref) =>
      ref.artifactType === 'track_graph_v2'))
  if (graphRefs.length !== 1) {
    throw new Error('Canonical-private SAM E2E did not project one exact Track Graph V2.')
  }
  const graph = trackGraphV2Schema.parse(
    await input.runtime.artifactStore.readJson({
      reference: graphRefs[0]!,
      ...scope,
    }),
  )
  const atomicOutputTypes = new Set<string>()
  for (const workResult of result.workItemResults) {
    const projection = await input.runtime.artifactStore.readJson({
      reference: workResult.qaEvidenceArtifactRefs[0]!,
      ...scope,
    }) as { atomicExecutionEvidenceRef?: unknown }
    if (!projection.atomicExecutionEvidenceRef) continue
    const atomic = await input.runtime.artifactStore.readJson({
      reference: projection.atomicExecutionEvidenceRef as Parameters<
        EditSkillRuntime['artifactStore']['readJson']
      >[0]['reference'],
      ...scope,
    }) as { atomicResults?: Array<{ outputArtifactRef: { artifactType: string } }> }
    for (const atomicResult of atomic.atomicResults ?? []) {
      atomicOutputTypes.add(atomicResult.outputArtifactRef.artifactType)
    }
  }
  const requiredQa = [
    'track_all_target_qa_report_v1',
    'track_all_temporal_qa_report_v1',
    'track_all_mask_qa_report_v1',
  ]
  if (requiredQa.some((artifactType) => !atomicOutputTypes.has(artifactType))) {
    throw new Error('Canonical-private SAM E2E lacks target, temporal, or mask QA lineage.')
  }
  const core = e2eReceiptCoreSchema.parse({
    schemaVersion:
      TRACK_ALL_SAM31_CANONICAL_PRIVATE_PUBLIC_E2E_RECEIPT_VERSION,
    operationId: 'tool.sam3_1.track_masklets.v2',
    evidenceClass: 'real_sam3_1_private_execution',
    assignmentHash: input.execution.assignment.assignmentHash,
    publicPlanHash: input.execution.publicPlan.envelope.planHash,
    pluginWorkGraphHash: input.execution.pluginWorkGraph.artifactHash,
    realCanaryReceiptHash: canary.receiptHash,
    finalSkillResultReceiptHash: result.finalResult.receiptHash,
    trackGraphV2Hash: graph.graphHash,
    samSessionReceiptRefs: result.executionCounts.samSessionReceiptRefs,
    samAttemptEvidenceRefs: result.executionCounts.samAttemptEvidenceRefs,
    actualSamRequestCount: 1,
    actualGpuExecutionCount: 1,
    everySessionClosed: true,
    targetQaObserved: true,
    temporalQaObserved: true,
    maskQaObserved: true,
    publicPluginLifecycleObserved: true,
    canonicalCoordinatorObserved: true,
    injectedEvidenceUsed: false,
    rawTensorDataPublished: false,
    publicMaskArtifactCount: 0,
    productionMutationCount: 0,
    productionQualified: false,
    completedAt: input.completedAt ?? new Date().toISOString(),
  })
  return deepFreezeSkillValue(
    trackAllSam31CanonicalPrivatePublicE2EReceiptSchema.parse({
      ...core,
      receiptHash: hashSkillValue(core),
    }),
  )
}
