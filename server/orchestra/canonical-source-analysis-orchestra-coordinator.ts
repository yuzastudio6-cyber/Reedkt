import { z } from 'zod'

import type {
  OrchestraEvidenceRef,
  OrchestraSkillCall,
} from '../../src/types/orchestra-skill-capability'
import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  parseOrchestraSkillCall,
} from './orchestra-skill-capability-contract'
import type {
  CanonicalSourceAnalysisL4ProbeAttemptOwner,
} from '../services/canonical-source-analysis-l4-probe-attempt-owner'
import {
  CANONICAL_SOURCE_ANALYSIS_L4_PROBE_ATTEMPT_OWNER_VERSION,
  createCanonicalSourceAnalysisL4ProbeTrigger,
} from '../services/canonical-source-analysis-l4-probe-attempt-owner'
import type {
  CanonicalSourceAnalysisL4VisualEvidenceReadPort,
  CanonicalSourceAnalysisL4VisualEvidenceResult,
} from '../services/canonical-source-analysis-l4-visual-evidence-repository'
import {
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_READ_PORT_VERSION,
} from '../services/canonical-source-analysis-l4-visual-evidence-repository'
import type {
  CanonicalSourceAnalysisL4VisualEvidenceAttemptOwner,
} from '../services/canonical-source-analysis-l4-visual-evidence-attempt-owner'
import {
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_ATTEMPT_OWNER_VERSION,
  createCanonicalSourceAnalysisL4VisualEvidenceTrigger,
} from '../services/canonical-source-analysis-l4-visual-evidence-attempt-owner'
import type {
  CanonicalSourceAnalysisPreparationOwner,
} from '../services/canonical-source-analysis-preparation-owner'
import {
  CANONICAL_SOURCE_ANALYSIS_PREPARATION_OWNER_VERSION,
} from '../services/canonical-source-analysis-preparation-owner'
import type {
  CanonicalSourceCleanupAuthorityReadPort,
  CanonicalSourceCleanupAuthorityScope,
} from '../services/canonical-source-cleanup-authority-repository'
import {
  createCanonicalSourceLedSourceFrameAuthority,
  verifyCanonicalSourceLedContentAnalysisEvidence,
} from '../services/canonical-source-led-content-analysis-evidence'
import type {
  CanonicalSourceAnalysisPlanningScope,
  CanonicalSourceAnalysisRequestAuthorityReadPort,
  CanonicalSourceLedOrchestraPlanningReconciliationPort,
} from '../services/canonical-source-led-orchestra-planning-reconciliation'
import {
  CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
  CANONICAL_SOURCE_LED_ORCHESTRA_PLANNING_RECONCILIATION_VERSION,
  verifyCanonicalSourceAnalysisPlanningScope,
  verifyCanonicalSourceAnalysisPreparedRequestForPlanning,
} from '../services/canonical-source-led-orchestra-planning-reconciliation'
import type {
  CanonicalSourceTranscriptOrchestraReadPort,
  CanonicalSourceTranscriptOrchestraReadScope,
} from '../services/canonical-source-led-orchestra-content-analysis-reconciliation'
import {
  CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
  createCanonicalSourceVisualIntelligenceOrchestraReconciliationScope,
} from '../services/canonical-source-led-orchestra-content-analysis-reconciliation'
import type {
  CanonicalSourceTranscriptA100AttemptOwner,
} from '../services/canonical-source-transcript-a100-attempt-owner'
import {
  CANONICAL_SOURCE_TRANSCRIPT_A100_ATTEMPT_OWNER_VERSION,
  createCanonicalSourceTranscriptTrigger,
} from '../services/canonical-source-transcript-a100-attempt-owner'
import type {
  CanonicalSourceVisualIntelligenceOrchestraBindingRequest,
  CanonicalSourceVisualIntelligenceOrchestraBindingScope,
} from '../services/canonical-source-visual-intelligence-orchestra-result-bridge'
import {
  prepareCanonicalSourceVisualIntelligenceOrchestraBindingRequest,
} from '../services/canonical-source-visual-intelligence-orchestra-result-bridge'
import {
  assertPlainSerializedData,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import type {
  VisualIntelligenceOrchestraJobRuntime,
} from '../visual-intelligence/visual-intelligence-orchestra-job-runtime'
import {
  VISUAL_INTELLIGENCE_ORCHESTRA_JOB_RUNTIME_VERSION,
} from '../visual-intelligence/visual-intelligence-orchestra-job-runtime'

export const CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_COORDINATOR_VERSION =
  'canonical-source-analysis-orchestra-coordinator-v3' as const
export const CANONICAL_SOURCE_ANALYSIS_USER_TRIGGER_VERSION =
  'canonical-source-analysis-user-trigger-v1' as const
export const CANONICAL_SOURCE_ANALYSIS_PLANNING_SCOPE_READ_PORT_VERSION =
  'canonical-source-analysis-planning-scope-read-port-v1' as const
export const CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_WORK_READ_PORT_VERSION =
  'canonical-source-analysis-orchestra-work-read-port-v1' as const
export const CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_WORK_VERSION =
  'canonical-source-analysis-orchestra-work-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const triggerWithoutDigestSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SOURCE_ANALYSIS_USER_TRIGGER_VERSION),
  source: z.literal('authenticated_server_source_analysis_user_trigger'),
  requestId: safeId,
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  userTriggerRecordRef: evidenceRefSchema,
  idempotencyKey: safeId,
  triggeredAt: timestamp,
  exactServerPlanningScopeRereadRequired: z.literal(true),
  browserSourceOrWorkAuthorityAccepted: z.literal(false),
  callerPathUrlBytesCommandOrEnvironmentAccepted: z.literal(false),
  customerCreditMutationAuthorized: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const triggerSchema = triggerWithoutDigestSchema.extend({
  triggerDigestSha256: rawSha256,
}).strict()

export type CanonicalSourceAnalysisUserTrigger = z.infer<
  typeof triggerSchema
>

export interface CanonicalSourceAnalysisPlanningScopeReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_PLANNING_SCOPE_READ_PORT_VERSION
  readExactPlanningScope(input: Readonly<{
    requestId: string
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    userTriggerRecordRef: VisualIntelligenceEvidenceRef
  }>): Promise<CanonicalSourceAnalysisPlanningScope | null>
}

export interface CanonicalSourceAnalysisOrchestraWork {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_WORK_VERSION
  readonly call: OrchestraSkillCall
  readonly supportRequest: null
  readonly consumerBindingRequest:
    CanonicalSourceVisualIntelligenceOrchestraBindingRequest
  readonly dispatchPackageRef: OrchestraEvidenceRef
  readonly exactOrchestraPlanJobManifestQualificationAndBudgetReread: true
  readonly dispatchPackagePersistedCreateOnlyBeforeExecution: true
  readonly browserOrCallerWorkAccepted: false
  readonly directProviderDispatchAllowed: false
  readonly directGpuDispatchAllowed: false
  readonly directTimelineMutationAllowed: false
  readonly customerCreditMutationAllowed: false
  readonly publicDeliveryGranted: false
  readonly productionAuthorityGranted: false
  readonly workDigestSha256: string
}

export interface CanonicalSourceAnalysisOrchestraWorkReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_WORK_READ_PORT_VERSION
  readExactSourceVideoUnderstandingWork(
    scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope,
  ): Promise<unknown | null>
}

export type CanonicalSourceAnalysisOrchestraCoordinatorResult =
  | Readonly<{
      status: 'blocked'
      stage:
        | 'planning_scope'
        | 'l4_probe'
        | 'preparation'
        | 'l4_visual_evidence'
        | 'a100_transcript'
        | 'orchestra_work'
        | 'head_reconciliation'
      sourceIndex: number | null
      blockerCode: string
      automaticRetryStarted: false
      automaticHeavyFallbackDispatched: false
      browserSourceOrWorkAuthorityAccepted: false
      customerCreditMutated: false
      publicDeliveryGranted: false
      productionAuthorityGranted: false
    }>
  | Readonly<{
      status: 'ready'
      analysisRunId: string
      requestDigestSha256: string
      sourceCount: number
      orchestraResultRefs: readonly OrchestraEvidenceRef[]
      cleanupAuthorityRef: VisualIntelligenceEvidenceRef
      cleanupEvidenceDigestSha256: string
      exactPlanningScopeRereadVerified: true
      allFinalizedSourceAndL4ProbeAuthoritiesReread: true
      allL4DeterministicVisualEvidenceReread: true
      l4ProbeScaleToZeroVerified: true
      l4VisualEvidenceScaleToZeroVerified: true
      allTranscriptAuthoritiesReread: true
      a100TranscriptScaleToZeroOrNoAudioBypassVerified: true
      allVisualIntelligenceResultsReturnedThroughOrchestra: true
      geminiProHighSourceAnalysisCompletedOrExactReplay: true
      headIntelligenceCleanupReasoningPersistedAndReread: true
      automaticHeavyFallbackDispatched: false
      directProviderOrGpuDispatchAcceptedFromCaller: false
      directTimelineMutationPerformed: false
      customerCreditMutated: false
      publicDeliveryGranted: false
      productionAuthorityGranted: false
    }>

export interface CanonicalSourceAnalysisOrchestraCoordinator {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_COORDINATOR_VERSION
  readonly owner: 'orchestra'
  readonly visualSkillKey: 'visual_intelligence'
  readonly userTriggeredOnly: true
  readonly sourceProbeRoute: 'l4_standard_primary'
  readonly sourceVisualEvidenceRoute: 'l4_standard_primary'
  readonly heavyTranscriptRoute: 'a100_80gb_heavy_primary'
  readonly automaticHeavyFallbackAllowed: false
  readonly directCallerSkillOrProviderDispatchAllowed: false
  execute(
    trigger: CanonicalSourceAnalysisUserTrigger,
  ): Promise<CanonicalSourceAnalysisOrchestraCoordinatorResult>
}

export function createCanonicalSourceAnalysisUserTrigger(input: Omit<
  CanonicalSourceAnalysisUserTrigger,
  'schemaVersion' | 'source' | 'triggerDigestSha256'
>): CanonicalSourceAnalysisUserTrigger {
  assertPlainSerializedData(input, 'source_analysis_user_trigger_input')
  const payload = triggerWithoutDigestSchema.parse({
    schemaVersion: CANONICAL_SOURCE_ANALYSIS_USER_TRIGGER_VERSION,
    source: 'authenticated_server_source_analysis_user_trigger',
    ...input,
  })
  return Object.freeze(triggerSchema.parse({
    ...payload,
    triggerDigestSha256: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalSourceAnalysisUserTrigger(
  value: unknown,
): CanonicalSourceAnalysisUserTrigger {
  assertPlainSerializedData(value, 'source_analysis_user_trigger')
  const trigger = triggerSchema.parse(value)
  const { triggerDigestSha256, ...payload } = trigger
  if (triggerDigestSha256 !== sha256AuthorityValue(payload)) {
    throw conflict('source_analysis_user_trigger_digest_invalid')
  }
  return Object.freeze(trigger)
}

export function createCanonicalSourceAnalysisOrchestraWork(input: Readonly<{
  scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope
  call: unknown
  dispatchPackageRef: OrchestraEvidenceRef
}>): CanonicalSourceAnalysisOrchestraWork {
  assertPlainSerializedData(input, 'source_analysis_orchestra_work_input')
  const call = parseOrchestraSkillCall(input.call)
  const consumerBindingRequest =
    prepareCanonicalSourceVisualIntelligenceOrchestraBindingRequest({
      scope: input.scope,
      orchestraCall: call,
    })
  const dispatchPackageRef = parseRef(input.dispatchPackageRef)
  const withoutDigest = {
    schemaVersion: CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_WORK_VERSION,
    call,
    supportRequest: null,
    consumerBindingRequest,
    dispatchPackageRef,
    exactOrchestraPlanJobManifestQualificationAndBudgetReread: true as const,
    dispatchPackagePersistedCreateOnlyBeforeExecution: true as const,
    browserOrCallerWorkAccepted: false as const,
    directProviderDispatchAllowed: false as const,
    directGpuDispatchAllowed: false as const,
    directTimelineMutationAllowed: false as const,
    customerCreditMutationAllowed: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return deepFreeze({
    ...withoutDigest,
    workDigestSha256: sha256AuthorityValue(withoutDigest),
  })
}

export function assertCanonicalSourceAnalysisOrchestraWork(input: Readonly<{
  value: unknown
  expectedScope: CanonicalSourceVisualIntelligenceOrchestraBindingScope
}>): CanonicalSourceAnalysisOrchestraWork {
  assertPlainSerializedData(input.value, 'source_analysis_orchestra_work')
  const value = exactRecord(input.value, [
    'schemaVersion', 'call', 'supportRequest', 'consumerBindingRequest',
    'dispatchPackageRef',
    'exactOrchestraPlanJobManifestQualificationAndBudgetReread',
    'dispatchPackagePersistedCreateOnlyBeforeExecution',
    'browserOrCallerWorkAccepted', 'directProviderDispatchAllowed',
    'directGpuDispatchAllowed', 'directTimelineMutationAllowed',
    'customerCreditMutationAllowed', 'publicDeliveryGranted',
    'productionAuthorityGranted', 'workDigestSha256',
  ]) as unknown as CanonicalSourceAnalysisOrchestraWork
  const call = parseOrchestraSkillCall(value.call)
  const expectedBindingRequest =
    prepareCanonicalSourceVisualIntelligenceOrchestraBindingRequest({
      scope: input.expectedScope,
      orchestraCall: call,
    })
  const dispatchPackageRef = parseRef(value.dispatchPackageRef)
  const { workDigestSha256, ...withoutDigest } = value
  if (
    value.schemaVersion !== CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_WORK_VERSION
    || value.supportRequest !== null
    || stableAuthorityStringify(value.consumerBindingRequest) !==
      stableAuthorityStringify(expectedBindingRequest)
    || !value.exactOrchestraPlanJobManifestQualificationAndBudgetReread
    || !value.dispatchPackagePersistedCreateOnlyBeforeExecution
    || value.browserOrCallerWorkAccepted
    || value.directProviderDispatchAllowed
    || value.directGpuDispatchAllowed
    || value.directTimelineMutationAllowed
    || value.customerCreditMutationAllowed
    || value.publicDeliveryGranted
    || value.productionAuthorityGranted
    || !rawSha256.safeParse(workDigestSha256).success
    || workDigestSha256 !== sha256AuthorityValue(withoutDigest)
  ) throw conflict('source_analysis_orchestra_work_invalid')
  return deepFreeze({
    ...value,
    call,
    consumerBindingRequest: expectedBindingRequest,
    dispatchPackageRef,
  })
}

/**
 * Runs the exact pre-plan source-analysis chain. The only caller-controlled
 * value is an authenticated trigger identity. Source metadata, GPU admission,
 * transcript evidence, Orchestra work, Gemini dispatch, and Head cleanup
 * decisions are independently reread from their canonical owners.
 */
export function createCanonicalSourceAnalysisOrchestraCoordinator(input: {
  readonly planningScopeReadPort:
    CanonicalSourceAnalysisPlanningScopeReadPort
  readonly probeAttemptOwner: CanonicalSourceAnalysisL4ProbeAttemptOwner
  readonly preparationOwner: CanonicalSourceAnalysisPreparationOwner
  readonly l4VisualEvidenceAttemptOwner:
    CanonicalSourceAnalysisL4VisualEvidenceAttemptOwner
  readonly transcriptAttemptOwner: CanonicalSourceTranscriptA100AttemptOwner
  readonly requestAuthorityReadPort:
    CanonicalSourceAnalysisRequestAuthorityReadPort
  readonly transcriptReadPort: CanonicalSourceTranscriptOrchestraReadPort
  readonly l4VisualEvidenceReadPort:
    CanonicalSourceAnalysisL4VisualEvidenceReadPort
  readonly orchestraWorkReadPort:
    CanonicalSourceAnalysisOrchestraWorkReadPort
  readonly orchestraRuntime: VisualIntelligenceOrchestraJobRuntime
  readonly planningReconciliationPort:
    CanonicalSourceLedOrchestraPlanningReconciliationPort
  readonly cleanupAuthorityReadPort: CanonicalSourceCleanupAuthorityReadPort
}): CanonicalSourceAnalysisOrchestraCoordinator {
  validateDependencies(input)
  return Object.freeze({
    schemaVersion: CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_COORDINATOR_VERSION,
    owner: 'orchestra' as const,
    visualSkillKey: 'visual_intelligence' as const,
    userTriggeredOnly: true as const,
    sourceProbeRoute: 'l4_standard_primary' as const,
    sourceVisualEvidenceRoute: 'l4_standard_primary' as const,
    heavyTranscriptRoute: 'a100_80gb_heavy_primary' as const,
    automaticHeavyFallbackAllowed: false as const,
    directCallerSkillOrProviderDispatchAllowed: false as const,
    async execute(untrustedTrigger: CanonicalSourceAnalysisUserTrigger) {
      const trigger = assertCanonicalSourceAnalysisUserTrigger(
        untrustedTrigger,
      )
      const scopeRaw = await input.planningScopeReadPort
        .readExactPlanningScope({
          requestId: trigger.requestId,
          ownerUserId: trigger.ownerUserId,
          workspaceId: trigger.workspaceId,
          projectId: trigger.projectId,
          editSessionId: trigger.editSessionId,
          userTriggerRecordRef: cloneRef(trigger.userTriggerRecordRef),
        })
      if (!scopeRaw) return blocked(
        'planning_scope', null, 'canonical_source_analysis_scope_not_ready',
      )
      const scope = verifyCanonicalSourceAnalysisPlanningScope(scopeRaw)
      assertTriggerScope(trigger, scope)

      for (const [index, source] of scope.sources.entries()) {
        const probe = await input.probeAttemptOwner.executeOneShot(
          createCanonicalSourceAnalysisL4ProbeTrigger({
            requestId: scopedId(trigger, 'probe', source.uploadedOrder),
            sourceIdentity: {
              ownerUserId: scope.ownerUserId,
              workspaceId: scope.workspaceId,
              projectId: scope.projectId,
              editSessionId: scope.editSessionId,
              sourceSequenceItemId: source.sourceSequenceItemId,
              mediaAssetId: source.mediaAssetId,
              uploadedOrder: source.uploadedOrder,
              storageProvider: source.storageProvider,
              storageBucket: source.storageBucket,
              storagePath: source.storagePath,
              contentType: source.contentType,
              checksumSha256: source.checksumSha256,
              byteLength: source.byteLength,
              storageGeneration: source.storageGeneration,
              storageEtag: source.storageEtag,
            },
            userTriggerRecordRef: cloneRef(trigger.userTriggerRecordRef),
            idempotencyKey: scopedId(
              trigger, 'probe-idempotency', source.uploadedOrder,
            ),
            triggeredAt: trigger.triggeredAt,
            serverDerivedFinalizedSourceIdentity: true,
            browserStorageIdentityAccepted: false,
            callerPathUrlBytesCommandOrEnvironmentAccepted: false,
            customerCreditMutationAuthorized: false,
            publicDeliveryAuthorized: false,
            productionAuthorityGranted: false,
          }),
        )
        if (probe.status !== 'ready') return blocked(
          'l4_probe', index + 1,
          probe.status === 'failed_before_creation'
            ? 'source_probe_failed_before_creation'
            : probe.blockerCode,
        )
      }

      const preparation = await input.preparationOwner.prepareForOrchestra(
        scope,
      )
      if (preparation.status !== 'ready') return blocked(
        'preparation', preparation.sourceIndex, preparation.blockerCode,
      )
      const preparedRaw = await input.requestAuthorityReadPort
        .readExactPreparedRequest(scope)
      if (!preparedRaw) return blocked(
        'preparation', null, 'canonical_source_analysis_request_not_ready',
      )
      const prepared = verifyCanonicalSourceAnalysisPreparedRequestForPlanning({
        scope,
        request: preparedRaw,
      })
      if (
        prepared.analysisRunId !== preparation.analysisRunId
        || prepared.requestDigest !== preparation.requestDigestSha256
      ) throw conflict('source_analysis_preparation_reread_mismatch')

      const l4VisualEvidenceResults:
        CanonicalSourceAnalysisL4VisualEvidenceResult[] = []
      for (const [index, source] of prepared.request.sources.entries()) {
        const attempt = await input.l4VisualEvidenceAttemptOwner.executeOneShot(
          createCanonicalSourceAnalysisL4VisualEvidenceTrigger({
            requestId: scopedId(
              trigger, 'l4-visual-evidence', source.uploadedOrder,
            ),
            planningScope: scope,
            sourceSequenceItemId: source.sourceSequenceItemId,
            mediaAssetId: source.mediaAssetId,
            userTriggerRecordRef: cloneRef(trigger.userTriggerRecordRef),
            idempotencyKey: scopedId(
              trigger, 'l4-visual-evidence-idempotency', source.uploadedOrder,
            ),
            triggeredAt: trigger.triggeredAt,
            serverPreparedRequestRequired: true,
            browserSourceOrEvidenceAuthorityAccepted: false,
            callerPathUrlBytesCommandOrEnvironmentAccepted: false,
            customerCreditMutationAuthorized: false,
            publicDeliveryAuthorized: false,
            productionAuthorityGranted: false,
          }),
        )
        if (attempt.status !== 'ready') return blocked(
          'l4_visual_evidence', index + 1,
          attempt.status === 'failed_before_creation'
            ? 'source_visual_evidence_failed_before_creation'
            : attempt.blockerCode,
        )
        const evidence = await input.l4VisualEvidenceReadPort.readCompleted(
          transcriptScope({
            request: prepared.request,
            analysisRunId: prepared.analysisRunId,
            source,
          }),
        )
        if (!evidence) return blocked(
          'l4_visual_evidence', index + 1,
          'canonical_source_l4_visual_evidence_not_ready',
        )
        if (evidence.resultDigestSha256 !== attempt.resultDigestSha256) {
          throw conflict('source_visual_evidence_attempt_reread_mismatch')
        }
        l4VisualEvidenceResults.push(evidence)
      }

      const transcriptResults = [] as Awaited<ReturnType<
        CanonicalSourceTranscriptOrchestraReadPort['readCompleted']
      >>[]
      for (const [index, source] of prepared.request.sources.entries()) {
        const transcript = await input.transcriptAttemptOwner.executeOneShot(
          createCanonicalSourceTranscriptTrigger({
            requestId: scopedId(trigger, 'transcript', source.uploadedOrder),
            planningScope: scope,
            sourceSequenceItemId: source.sourceSequenceItemId,
            mediaAssetId: source.mediaAssetId,
            userTriggerRecordRef: cloneRef(trigger.userTriggerRecordRef),
            idempotencyKey: scopedId(
              trigger, 'transcript-idempotency', source.uploadedOrder,
            ),
            triggeredAt: trigger.triggeredAt,
            serverPreparedRequestRequired: true,
            browserSourceOrTranscriptAuthorityAccepted: false,
            callerPathUrlBytesCommandOrEnvironmentAccepted: false,
            customerCreditMutationAuthorized: false,
            publicDeliveryAuthorized: false,
            productionAuthorityGranted: false,
          }),
        )
        if (transcript.status !== 'ready') return blocked(
          'a100_transcript', index + 1, transcript.blockerCode,
        )
        const transcriptResult = await input.transcriptReadPort.readCompleted(
          transcriptScope({
            request: prepared.request,
            analysisRunId: prepared.analysisRunId,
            source,
          }),
        )
        if (!transcriptResult) return blocked(
          'a100_transcript', index + 1,
          'canonical_source_transcript_reread_not_ready',
        )
        if (!sameRef(
          transcriptResult.transcriptAuthorityRef,
          transcript.transcriptAuthorityRef,
        )) throw conflict('source_analysis_transcript_authority_mismatch')
        transcriptResults.push(transcriptResult)
      }

      const orchestraResultRefs: OrchestraEvidenceRef[] = []
      for (const [index, source] of prepared.request.sources.entries()) {
        const transcriptResult = transcriptResults[index]!
        const bindingScope =
          createCanonicalSourceVisualIntelligenceOrchestraReconciliationScope({
            request: prepared.request,
            analysisRunId: prepared.analysisRunId,
            source,
            transcriptResult,
          })
        const workRaw = await input.orchestraWorkReadPort
          .readExactSourceVideoUnderstandingWork(bindingScope)
        if (!workRaw) return blocked(
          'orchestra_work', index + 1,
          'canonical_source_visual_intelligence_orchestra_work_not_ready',
        )
        const work = assertCanonicalSourceAnalysisOrchestraWork({
          value: workRaw,
          expectedScope: bindingScope,
        })
        assertExactSourceEvidenceRefs({
          work,
          l4VisualEvidence: l4VisualEvidenceResults[index]!,
          transcriptAuthorityRef: transcriptResult.transcriptAuthorityRef,
        })
        const execution = await input.orchestraRuntime.execute({
          call: work.call,
          supportRequest: null,
          authenticatedOwnerUserId: scope.ownerUserId,
          expectedWorkspaceId: scope.workspaceId,
          consumerBindingRequest: work.consumerBindingRequest,
        })
        if (!sameRef(execution.dispatchPackageRef, work.dispatchPackageRef)) {
          throw conflict('source_analysis_orchestra_dispatch_ref_mismatch')
        }
        orchestraResultRefs.push(cloneRef(execution.resultRef))
      }

      const reconciliation = await input.planningReconciliationPort
        .reconcileForPlanning(scope)
      if (reconciliation.status !== 'ready') return blocked(
        'head_reconciliation', null, reconciliation.blockerCode,
      )
      const cleanup = await input.cleanupAuthorityReadPort.readForPlanning(
        cleanupScope(scope),
      )
      if (cleanup.status !== 'ready') return blocked(
        'head_reconciliation', null,
        'canonical_source_cleanup_authority_reread_not_ready',
      )
      const cleanupEvidence = verifyCanonicalSourceLedContentAnalysisEvidence(
        cleanup.authority.evidence,
      )
      if (
        cleanupEvidence.evidenceDigestSha256 !==
          reconciliation.evidenceDigestSha256
      ) throw conflict('source_analysis_cleanup_evidence_digest_mismatch')

      return Object.freeze({
        status: 'ready' as const,
        analysisRunId: prepared.analysisRunId,
        requestDigestSha256: prepared.requestDigest,
        sourceCount: prepared.request.sources.length,
        orchestraResultRefs: Object.freeze(orchestraResultRefs),
        cleanupAuthorityRef: cloneRef(cleanup.repositoryRecordRef),
        cleanupEvidenceDigestSha256: reconciliation.evidenceDigestSha256,
        exactPlanningScopeRereadVerified: true as const,
        allFinalizedSourceAndL4ProbeAuthoritiesReread: true as const,
        allL4DeterministicVisualEvidenceReread: true as const,
        l4ProbeScaleToZeroVerified: true as const,
        l4VisualEvidenceScaleToZeroVerified: true as const,
        allTranscriptAuthoritiesReread: true as const,
        a100TranscriptScaleToZeroOrNoAudioBypassVerified: true as const,
        allVisualIntelligenceResultsReturnedThroughOrchestra: true as const,
        geminiProHighSourceAnalysisCompletedOrExactReplay: true as const,
        headIntelligenceCleanupReasoningPersistedAndReread: true as const,
        automaticHeavyFallbackDispatched: false as const,
        directProviderOrGpuDispatchAcceptedFromCaller: false as const,
        directTimelineMutationPerformed: false as const,
        customerCreditMutated: false as const,
        publicDeliveryGranted: false as const,
        productionAuthorityGranted: false as const,
      })
    },
  })
}

function validateDependencies(input: Parameters<
  typeof createCanonicalSourceAnalysisOrchestraCoordinator
>[0]): void {
  if (
    input.planningScopeReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_PLANNING_SCOPE_READ_PORT_VERSION
    || typeof input.planningScopeReadPort.readExactPlanningScope !== 'function'
    || input.probeAttemptOwner?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_L4_PROBE_ATTEMPT_OWNER_VERSION
    || typeof input.probeAttemptOwner.executeOneShot !== 'function'
    || input.preparationOwner?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_PREPARATION_OWNER_VERSION
    || typeof input.preparationOwner.prepareForOrchestra !== 'function'
    || input.l4VisualEvidenceAttemptOwner?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_ATTEMPT_OWNER_VERSION
    || typeof input.l4VisualEvidenceAttemptOwner.executeOneShot !== 'function'
    || input.transcriptAttemptOwner?.schemaVersion !==
      CANONICAL_SOURCE_TRANSCRIPT_A100_ATTEMPT_OWNER_VERSION
    || typeof input.transcriptAttemptOwner.executeOneShot !== 'function'
    || input.requestAuthorityReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION
    || typeof input.requestAuthorityReadPort.readExactPreparedRequest !==
      'function'
    || input.transcriptReadPort?.schemaVersion !==
      CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION
    || typeof input.transcriptReadPort.readCompleted !== 'function'
    || input.l4VisualEvidenceReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_READ_PORT_VERSION
    || typeof input.l4VisualEvidenceReadPort.readCompleted !== 'function'
    || input.orchestraWorkReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_WORK_READ_PORT_VERSION
    || typeof input.orchestraWorkReadPort
      .readExactSourceVideoUnderstandingWork !== 'function'
    || input.orchestraRuntime?.schemaVersion !==
      VISUAL_INTELLIGENCE_ORCHESTRA_JOB_RUNTIME_VERSION
    || typeof input.orchestraRuntime.execute !== 'function'
    || input.planningReconciliationPort?.schemaVersion !==
      CANONICAL_SOURCE_LED_ORCHESTRA_PLANNING_RECONCILIATION_VERSION
    || typeof input.planningReconciliationPort.reconcileForPlanning !==
      'function'
    || typeof input.cleanupAuthorityReadPort?.readForPlanning !== 'function'
  ) throw notReady('source_analysis_orchestra_coordinator_dependencies_invalid')
}

function assertExactSourceEvidenceRefs(input: Readonly<{
  work: CanonicalSourceAnalysisOrchestraWork
  l4VisualEvidence: CanonicalSourceAnalysisL4VisualEvidenceResult
  transcriptAuthorityRef: VisualIntelligenceEvidenceRef
}>): void {
  const expected = [
    ...input.l4VisualEvidence.toolEvidence.map((item) => item.evidenceRef),
    input.transcriptAuthorityRef,
  ]
  if (
    new Set(expected.map(refKey)).size !== expected.length
    || stableAuthorityStringify(input.work.call.requiredEvidenceRefs) !==
      stableAuthorityStringify(expected)
  ) throw conflict('source_analysis_orchestra_required_evidence_mismatch')
}

function transcriptScope(input: Readonly<{
  request: ReturnType<
    typeof verifyCanonicalSourceAnalysisPreparedRequestForPlanning
  >['request']
  analysisRunId: string
  source: ReturnType<
    typeof verifyCanonicalSourceAnalysisPreparedRequestForPlanning
  >['request']['sources'][number]
}>): CanonicalSourceTranscriptOrchestraReadScope {
  const authority = input.source.managedApiAuthority
  if (!authority) throw conflict('source_analysis_managed_authority_missing')
  return Object.freeze({
    ownerUserId: authority.ownerUserId,
    workspaceId: input.request.workspaceId,
    projectId: input.request.projectId,
    editSessionId: input.request.editSessionId,
    analysisRunId: input.analysisRunId,
    sourceSequenceItemId: input.source.sourceSequenceItemId,
    mediaAssetId: input.source.mediaAssetId,
    uploadedOrder: input.source.uploadedOrder,
    checksumSha256: input.source.checksumSha256,
    byteLength: input.source.byteLength,
    durationFrames: input.source.durationFrames,
    sourceFrameAuthority: createCanonicalSourceLedSourceFrameAuthority({
      fpsNumerator: authority.fpsNumerator,
      fpsDenominator: authority.fpsDenominator,
      frameCount: authority.frameCount,
      timeBaseNumerator: authority.sourceTimeBaseNumerator!,
      timeBaseDenominator: authority.sourceTimeBaseDenominator!,
    }),
    finalizedMediaAuthorityRef: cloneRef(
      authority.finalizedMediaAuthorityRef,
    ),
    sourceProbeAuthorityRef: cloneRef(authority.sourceProbeAuthorityRef),
  })
}

function cleanupScope(
  scope: CanonicalSourceAnalysisPlanningScope,
): CanonicalSourceCleanupAuthorityScope {
  return Object.freeze({
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    planningDirectionDigestSha256: scope.planningDirectionDigestSha256,
    userInstructionDigestSha256: scope.userInstructionDigestSha256,
    sources: Object.freeze(scope.sources.map((source) => Object.freeze({
      sourceSequenceItemId: source.sourceSequenceItemId,
      mediaAssetId: source.mediaAssetId,
      uploadedOrder: source.uploadedOrder,
      checksumSha256: source.checksumSha256,
    }))),
  })
}

function assertTriggerScope(
  trigger: CanonicalSourceAnalysisUserTrigger,
  scope: CanonicalSourceAnalysisPlanningScope,
): void {
  if (
    scope.ownerUserId !== trigger.ownerUserId
    || scope.workspaceId !== trigger.workspaceId
    || scope.projectId !== trigger.projectId
    || scope.editSessionId !== trigger.editSessionId
  ) throw new ApiError(
    'WORKSPACE_ACCESS_DENIED',
    'The source-analysis scope is outside the authenticated trigger.',
    403,
  )
}

function scopedId(
  trigger: CanonicalSourceAnalysisUserTrigger,
  purpose: string,
  uploadedOrder: number,
): string {
  return `source-analysis-${purpose}-${sha256AuthorityValue({
    triggerDigestSha256: trigger.triggerDigestSha256,
    uploadedOrder,
  }).slice(0, 32)}`
}

function blocked(
  stage: Extract<
    CanonicalSourceAnalysisOrchestraCoordinatorResult,
    { status: 'blocked' }
  >['stage'],
  sourceIndex: number | null,
  blockerCode: string,
): Extract<
  CanonicalSourceAnalysisOrchestraCoordinatorResult,
  { status: 'blocked' }
> {
  return Object.freeze({
    status: 'blocked' as const,
    stage,
    sourceIndex,
    blockerCode,
    automaticRetryStarted: false as const,
    automaticHeavyFallbackDispatched: false as const,
    browserSourceOrWorkAuthorityAccepted: false as const,
    customerCreditMutated: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  })
}

function exactRecord(value: unknown, keys: readonly string[]): object {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw conflict('source_analysis_orchestra_work_shape_invalid')
  }
  const actual = Object.keys(value).sort(compare)
  const expected = [...keys].sort(compare)
  if (stableAuthorityStringify(actual) !== stableAuthorityStringify(expected)) {
    throw conflict('source_analysis_orchestra_work_shape_invalid')
  }
  return value
}

function parseRef(value: unknown): OrchestraEvidenceRef {
  const parsed = evidenceRefSchema.parse(value)
  return Object.freeze({ ...parsed })
}

function cloneRef<T extends OrchestraEvidenceRef>(value: T): T {
  return Object.freeze({ ...value }) as T
}

function sameRef(left: OrchestraEvidenceRef, right: OrchestraEvidenceRef): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function refKey(value: OrchestraEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
  }
  return value
}

function notReady(blockerCode: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    `Canonical source-analysis Orchestra coordination is not ready: ${blockerCode}.`,
    503,
  )
}

function conflict(blockerCode: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    `Canonical source-analysis Orchestra coordination failed: ${blockerCode}.`,
    409,
  )
}
