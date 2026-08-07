import { createHash } from 'node:crypto'

import {
  createInitialInjectedBrollCandidateAttemptEvidence,
  type BrollCandidateAttemptEvidence,
} from './b-roll-candidate-attempt'
import {
  executeBrollCandidateQa,
  type BrollCandidateQaReport,
  type BrollCandidateVersion,
} from './b-roll-candidate-qa'
import type {
  BrollPlanArtifact,
  BrollPlanningContext,
  BrollSkillAssignment,
} from './b-roll-contracts'
import {
  assertBrollAssignment,
  assertBrollPlanningContext,
} from './b-roll-context-loader'
import {
  createBrollExistingSourceExecutionPipeline,
  type BrollExistingSourceExecutionInput,
  type BrollExistingSourceExecutionPipeline,
  type BrollExistingSourceExecutionReceipt,
  type BrollExistingSourceInspectionStage,
  type BrollExistingSourceNormalizationStage,
  type BrollProviderRequestObserver,
} from './b-roll-existing-source-execution'
import {
  brollVisualOwnershipManifestSchema,
  frameRangesOverlap,
  type BrollVisualOwnershipManifest,
} from './b-roll-input-authorities'
import { BROLL_CAPABILITY_MANIFEST } from './b-roll-capability-manifest'
import { assertBrollPlanRuntimeInvariants } from './b-roll-plan-compiler'
import type { BrollPlanningQaReport } from './b-roll-planning-qa'
import {
  executeBrollRemotionIntegration,
  prepareBrollRemotionPreviewProxy,
  prepareBrollRemotionLayerManifest,
  type BrollIntegrationQaReport,
  type BrollPreparedRemotionLayer,
  type BrollPreparedRemotionPreviewProxy,
  type BrollRemotionLayerManifest,
  type BrollResultReceipt,
} from './b-roll-remotion-integration'
import {
  createBrollSemanticVisualObservation,
  type BrollSemanticVisualObservation,
} from './mini-skills/candidate-qa-director'
import {
  assertBrollCanonicalWorkGraph,
  type BrollCanonicalWorkDefinition,
  type BrollCanonicalWorkGraph,
} from './b-roll-work-graph-compiler'
import type {
  SkillJobRuntimeAdapterResult,
  SkillJobRuntimeInvocation,
} from '../core/edit-skill-runtime-binding'
import {
  editSkillDependencyAcceptanceSchema,
  type EditSkillDependencyAcceptance,
} from '../core/edit-skill-dependency-request'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import type { EditSkillArtifactReference } from '../core/edit-skill-artifact-store'
import {
  editSkillApprovedWorkGraphSchema,
  type EditSkillApprovedWorkGraph,
} from '../core/edit-skill-plugin'
import type { CanonicalWorkItemInput } from '../../validation/edit-planning-authority-schemas'
import type {
  BrollProviderInjectedLifecycleTimesV5,
  BrollProviderWorkAuthorizationV5,
  BrollProviderRequestPackageV5,
} from '../../providers/google/gemini-omni-broll'
import {
  createBrollCandidateManifest,
  createBrollCandidateMediaManifest,
  createBrollExistingSourceCandidateVersion,
  createBrollPrivatePreviewMediaManifest,
  createBrollRemotionPreviewProxyManifest,
  createBrollRuntimeQaReport,
  sourceMediaArtifactV1Schema,
  type SourceMediaArtifactV1,
} from './b-roll-active-artifact-contracts'
import {
  executePrivateInjectedBrollProviderLifecycleV5,
} from '../../providers/google/gemini-omni-broll'
import type { CanonicalBrollSkillPlanComponent } from './b-roll-canonical-plan-component'
import {
  readCanonicalPrivateMediaArtifact,
} from '../../services/canonical-private-media-artifact-storage'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from '../../services/private-edit-authority-store'
import {
  revalidateCanonicalBrollPlanAuthority,
} from '../../services/canonical-broll-plan-component-service'
import type { PrivateOfflineMediaBinaryRuntime } from '../../tool-execution/media-binary-execution'
import type { PrivateOfflineRemotionRenderRuntime } from '../../tool-execution/remotion-render-execution'
import {
  createBrollCanonicalNoActionResultReceipt,
  type BrollCanonicalNoActionResultReceipt,
} from './b-roll-active-artifact-contracts'
import {
  brollSemanticChecksFromVisualIntelligence,
  brollVisualIntelligenceCandidateQaSchema,
  type BrollVisualIntelligenceCandidateQa,
} from './b-roll-visual-intelligence-dependency'

type FullMediaRuntime = Pick<
  PrivateOfflineMediaBinaryRuntime,
  'execute' | 'executeServerInjected' | 'executeVisualCalibrationObjectiveQaServerInjected'
>

/** Internal-fixture-only semantic evidence. Never production qualified. */
export function createBrollCanonicalInjectedTestObservation(
  input: Parameters<typeof createBrollSemanticVisualObservation>[0],
): BrollSemanticVisualObservation {
  const observation = createBrollSemanticVisualObservation(input)
  if (!observation.testOnly || observation.productionQualified) {
    throw new Error('Canonical injected semantic evidence must remain test-only and non-production.')
  }
  return observation
}

interface BrollCanonicalPrivateCommonInput {
  localStorageRoot: string
  approvalHash: string
  approvedWorkGraphHash: string
  approvedPublicWorkGraph?: EditSkillApprovedWorkGraph
  requirePublicDependencyAcceptance?: boolean
  component: CanonicalBrollSkillPlanComponent
  componentRef: AuthorityJsonBlobRef
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
  visualOwnership: BrollVisualOwnershipManifest
  plan: BrollPlanArtifact
  planningQaReport: BrollPlanningQaReport
  workGraph: BrollCanonicalWorkGraph
  canonicalWorkItems: CanonicalWorkItemInput[]
  now?: () => string
}

interface BrollCanonicalPrivateRenderableInput {
  captionOverlay: {
    reference: EditSkillArtifactReference
    bytes: Buffer
    reservedZoneCount: number
  }
  mediaRuntime: FullMediaRuntime
  remotionRuntime: Pick<PrivateOfflineRemotionRenderRuntime, 'execute'>
  integrationInfrastructureCostMicros: number
  trackGraph?: Parameters<typeof executeBrollRemotionIntegration>[0]['trackGraph']
}

export type BrollCanonicalPrivateExecutionInput = BrollCanonicalPrivateCommonInput & (
  | {
      route: 'professional_no_action'
    }
  | BrollCanonicalPrivateRenderableInput & {
      route: 'existing_source'
      executionGate: BrollExistingSourceExecutionInput['gate']
      source: {
        sourceId: string
        artifactRef: EditSkillArtifactReference
        mediaManifest: SourceMediaArtifactV1
        mimeType: 'video/mp4'
        bytes: Buffer
      }
      providerObserver: BrollProviderRequestObserver
    }
  | BrollCanonicalPrivateRenderableInput & {
      route: 'generated_injected'
      requestPackage: BrollProviderRequestPackageV5
      authorization: BrollProviderWorkAuthorizationV5
      workerIdentity: string
      dispatchSecret: string
      leaseDurationMs: number
      lifecycleTimes: BrollProviderInjectedLifecycleTimesV5
      candidate: {
        outputId: string
        bytes: Buffer
        infrastructureCostMicros: number
        rawInfrastructureUsageEvidenceDigest: string
        injectedInteractionIdDigest: string
        semanticObservation: BrollSemanticVisualObservation
      }
    }
)

export interface BrollCanonicalPrivateWorkExecutor {
  execute(
    definition: BrollCanonicalWorkDefinition,
    invocation: SkillJobRuntimeInvocation,
  ): Promise<SkillJobRuntimeAdapterResult>
}

type ExistingExecution = Awaited<
  ReturnType<BrollExistingSourceExecutionPipeline['finalize']>
>
type CandidateQaExecution = Awaited<ReturnType<typeof executeBrollCandidateQa>>
type RemotionExecution = Awaited<ReturnType<typeof executeBrollRemotionIntegration>>

interface BrollCanonicalPrivateExecutionState {
  validatedAuthority?: Awaited<ReturnType<typeof revalidateCanonicalBrollPlanAuthority>>
  existingPipeline?: BrollExistingSourceExecutionPipeline
  existingInspection?: BrollExistingSourceInspectionStage
  existingNormalization?: BrollExistingSourceNormalizationStage
  existing?: ExistingExecution
  initialAttempt?: BrollCandidateAttemptEvidence
  candidateQa?: CandidateQaExecution
  preparedIntegration?: BrollPreparedRemotionLayer
  preparedPreviewProxy?: BrollPreparedRemotionPreviewProxy
  integration?: RemotionExecution
  noAction?: {
    receipt: BrollCanonicalNoActionResultReceipt
    receiptRef: AuthorityJsonBlobRef
  }
}

/**
 * Owns the private B-roll mini-skill/runtime details behind the generic runtime
 * binding boundary. The generic dispatcher sees only exact bindings and hashes.
 */
export class BrollCanonicalPrivateExecutionCoordinator
implements BrollCanonicalPrivateWorkExecutor {
  readonly #input: BrollCanonicalPrivateExecutionInput
  readonly #state: BrollCanonicalPrivateExecutionState = {}
  readonly #completed = new Set<string>()
  readonly #results = new Map<string, SkillJobRuntimeAdapterResult>()
  readonly #outputArtifacts = new Map<string, { artifactType: string; value: unknown }>()
  #visualIntelligenceAcceptance?: EditSkillDependencyAcceptance
  #visualIntelligenceArtifact?: BrollVisualIntelligenceCandidateQa

  constructor(input: BrollCanonicalPrivateExecutionInput) {
    this.#input = input
    if (!/^[a-f0-9]{64}$/u.test(input.approvalHash)) {
      throw new Error('Canonical private B-roll execution requires an exact approval hash.')
    }
    if (!/^[a-f0-9]{64}$/u.test(input.approvedWorkGraphHash)) {
      throw new Error('Canonical private B-roll execution requires an exact approved work-graph hash.')
    }
    if (input.approvedPublicWorkGraph) {
      const publicGraph = editSkillApprovedWorkGraphSchema.parse(input.approvedPublicWorkGraph)
      if (
        publicGraph.approvedWorkGraphHash !== input.approvedWorkGraphHash ||
        publicGraph.pluginWorkGraphHash !== input.workGraph.workGraphHash ||
        publicGraph.assignmentId !== input.assignment.assignmentId ||
        publicGraph.planId !== input.plan.planId ||
        hashSkillValue(publicGraph.manifestRef) !== hashSkillValue(input.assignment.manifestRef) ||
        publicGraph.workItems.length !== input.workGraph.workItems.length ||
        publicGraph.workItems.some((publicItem, index) => {
          const privateItem = input.workGraph.workItems[index]
          return !privateItem || publicItem.workItemKey !== privateItem.workItemKey ||
            publicItem.jobType !== privateItem.jobType ||
            publicItem.operationId !== privateItem.operationId ||
            publicItem.workerClass !== privateItem.workerClass ||
            publicItem.expectedOutputType !== privateItem.expectedOutputType ||
            hashSkillValue(publicItem.authorizedRange) !== hashSkillValue(privateItem.authorizedRange)
        })
      ) throw new Error('Canonical private B-roll runtime rejected a stale public work-graph bridge.')
    }
    this.#assertConfiguredRoute()
  }

  async execute(
    definition: BrollCanonicalWorkDefinition,
    invocation: SkillJobRuntimeInvocation,
  ): Promise<SkillJobRuntimeAdapterResult> {
    this.#assertInvocation(definition, invocation)
    const replay = this.#results.get(invocation.workItemKey)
    if (replay) return replay
    const item = this.#input.workGraph.workItems.find((candidate) =>
      candidate.workItemKey === invocation.workItemKey)
    if (!item) throw new Error('Canonical private B-roll adapter received work outside the graph.')
    if (item.dependencyKeys.some((key) => !this.#completed.has(key))) {
      throw new Error('Canonical private B-roll adapter received work before its dependencies.')
    }
    const evidenceHashes = await this.#executeOperation(definition)
    const outputArtifact = await this.#projectOutputArtifact(definition, invocation)
    const operationEvidenceHash = hashSkillValue({
      schemaVersion: 'b_roll_canonical_private_operation_evidence_v1',
      bindingHash: invocation.binding.bindingHash,
      approvalHash: invocation.approvalHash,
      assignmentHash: invocation.assignmentHash,
      workItemHash: invocation.workItemHash,
      operationId: definition.operationId,
      authorizedPhase: invocation.authorizedPhase,
      evidenceHashes,
      providerRequestCount: 0,
      publicArtifactCount: 0,
      productionMutationCount: 0,
      outputArtifactHash: hashSkillValue(outputArtifact.value),
      outsideAuthorizedRangeModified: false,
    })
    const result: SkillJobRuntimeAdapterResult = {
      status: 'succeeded',
      outputArtifactTypes: [definition.output],
      evidenceHashes: [...new Set([...evidenceHashes, operationEvidenceHash])],
      providerRequestCount: 0,
      publicArtifactCount: 0,
      productionMutationCount: 0,
      outputArtifacts: [outputArtifact],
    }
    this.#results.set(invocation.workItemKey, result)
    this.#completed.add(invocation.workItemKey)
    return result
  }

  acceptDependencyAcceptance(
    input: EditSkillDependencyAcceptance,
    artifactInput?: BrollVisualIntelligenceCandidateQa,
  ): void {
    const acceptance = editSkillDependencyAcceptanceSchema.parse(input)
    if (
      acceptance.assignmentId !== this.#input.assignment.assignmentId ||
      acceptance.assignmentHash !== this.#publicAssignmentHash() ||
      acceptance.planHash !== this.#publicPlanHash() ||
      hashSkillValue(acceptance.manifestRef) !== hashSkillValue(this.#input.assignment.manifestRef) ||
      acceptance.acceptedForPhase !== 'skill_output_qa'
    ) throw new Error('Canonical private B-roll dependency acceptance is stale or out of phase.')
    if (artifactInput) {
      const artifact = brollVisualIntelligenceCandidateQaSchema.parse(artifactInput)
      const candidate = this.#latestMediaManifest()
      if (
        acceptance.artifactRef.artifactType !== 'visual_intelligence_candidate_qa_v1' ||
        acceptance.artifactRef.sha256 !== hashSkillValue(artifact) ||
        artifact.assignmentId !== this.#input.assignment.assignmentId ||
        artifact.assignmentHash !== this.#publicAssignmentHash() ||
        artifact.planId !== this.#input.plan.planId ||
        artifact.planHash !== this.#publicPlanHash() ||
        artifact.candidateArtifact.sha256 !== hashSkillValue(candidate) ||
        hashSkillValue(artifact.authorizedRange) !==
          hashSkillValue(this.#input.assignment.writeRangeAuthority.authorizedRange) ||
        !['accepted', 'accepted_with_warnings'].includes(artifact.disposition) ||
        artifact.injectedTestOnly
      ) throw new Error('Canonical private B-roll rejected stale Visual Intelligence evidence.')
      this.#visualIntelligenceArtifact = artifact
    } else if (this.#input.requirePublicDependencyAcceptance) {
      throw new Error('Canonical private B-roll requires the accepted Visual Intelligence artifact value.')
    }
    this.#visualIntelligenceAcceptance = acceptance
  }

  snapshot(): Readonly<{
    completedWorkItemKeys: readonly string[]
    existingReceipt?: BrollExistingSourceExecutionReceipt
    candidateVersion?: BrollCandidateVersion
    candidateQaReport?: BrollCandidateQaReport
    layerManifest?: BrollRemotionLayerManifest
    integrationQa?: BrollIntegrationQaReport
    resultReceipt?: BrollResultReceipt | BrollCanonicalNoActionResultReceipt
  }> {
    return Object.freeze({
      completedWorkItemKeys: Object.freeze([...this.#completed]),
      ...(this.#state.existing ? { existingReceipt: this.#state.existing.receipt } : {}),
      ...(this.#state.candidateQa ? {
        candidateVersion: this.#state.candidateQa.version,
        candidateQaReport: this.#state.candidateQa.qaReport,
      } : {}),
      ...(this.#state.integration ? {
        layerManifest: this.#state.integration.layerManifest,
        integrationQa: this.#state.integration.integrationQa,
        resultReceipt: this.#state.integration.receipt,
      } : this.#state.noAction ? { resultReceipt: this.#state.noAction.receipt } : {}),
    })
  }

  #assertConfiguredRoute(): void {
    const route = this.#input.workGraph.route
    const expected = route === 'no_action'
      ? 'professional_no_action'
      : route === 'gemini_omni'
        ? 'generated_injected'
        : 'existing_source'
    if (this.#input.route !== expected) {
      throw new Error('Canonical private B-roll execution route differs from the approved graph.')
    }
  }

  #assertInvocation(
    definition: BrollCanonicalWorkDefinition,
    invocation: SkillJobRuntimeInvocation,
  ): void {
    const item = this.#input.workGraph.workItems.find((candidate) =>
      candidate.workItemKey === invocation.workItemKey)
    if (
      invocation.mode !== 'canonical_private_execution_adapter' ||
      invocation.environmentClass !== 'canonical_private' ||
      invocation.binding.adapterClass !== 'canonical_private_execution_adapter' ||
      invocation.binding.environmentClass !== 'canonical_private' ||
      invocation.approvalHash !== this.#input.approvalHash ||
      invocation.assignmentId !== this.#input.assignment.assignmentId ||
      invocation.assignmentHash !== this.#publicAssignmentHash() ||
      invocation.binding.jobType !== definition.jobType ||
      invocation.binding.operationId !== definition.operationId ||
      invocation.binding.workerClass !== definition.workerClass ||
      invocation.authorizedPhase !== definition.allowedPhase ||
      !item || item.jobType !== definition.jobType ||
      item.operationId !== definition.operationId ||
      item.workerClass !== definition.workerClass ||
      this.#publicWorkItemHash(item.workItemKey) !== invocation.workItemHash ||
      hashSkillValue(item.authorizedRange) !==
        hashSkillValue(this.#input.assignment.writeRangeAuthority.authorizedRange)
    ) throw new Error('Canonical private B-roll adapter rejected stale or unbound work.')
  }

  #publicAssignmentHash(): string {
    return this.#input.approvedPublicWorkGraph?.assignmentHash ??
      this.#input.assignment.assignmentHash
  }

  #publicPlanHash(): string {
    return this.#input.approvedPublicWorkGraph?.planHash ?? this.#input.plan.planHash
  }

  #publicWorkItemHash(workItemKey: string): string | undefined {
    return this.#input.approvedPublicWorkGraph?.workItems.find((item) =>
      item.workItemKey === workItemKey)?.workItemHash ??
      this.#input.workGraph.workItems.find((item) =>
        item.workItemKey === workItemKey)?.workItemHash
  }

  async #executeOperation(definition: BrollCanonicalWorkDefinition): Promise<string[]> {
    switch (definition.jobType) {
      case 'validate_b_roll_assignment': {
        await this.#ensureAuthority()
        return [this.#input.assignment.assignmentHash, this.#input.component.componentHash]
      }
      case 'validate_b_roll_range_authority': {
        await this.#ensureAuthority()
        assertBrollPlanRuntimeInvariants({
          assignment: this.#input.assignment,
          plan: this.#input.plan,
          planningQaReport: this.#input.planningQaReport,
          planningContextHash: this.#input.context.contextHash,
          requireExactPlanningQaReport: true,
        })
        this.#assertOwnership()
        return [
          this.#input.plan.planHash,
          this.#input.workGraph.workGraphHash,
          this.#input.visualOwnership.ownershipHash,
        ]
      }
      case 'validate_b_roll_source': {
        await this.#ensureAuthority()
        if (this.#input.route !== 'existing_source') {
          throw new Error('Source validation cannot run for a non-source B-roll route.')
        }
        const source = this.#input.source
        const mediaManifest = sourceMediaArtifactV1Schema.parse(source.mediaManifest)
        if (
          this.#input.plan.sourceCandidateId !== source.sourceId ||
          hashSkillValue(this.#input.plan.sourceArtifactRef) !== hashSkillValue(source.artifactRef) ||
          source.artifactRef.sha256 !== hashSkillValue(mediaManifest) ||
          source.bytes.byteLength !== mediaManifest.byteLength ||
          createHash('sha256').update(source.bytes).digest('hex') !== mediaManifest.objectSha256
        ) throw new Error('Canonical private B-roll source selection is stale.')
        return [
          source.artifactRef.sha256,
          mediaManifest.objectSha256,
          hashSkillValue({ sourceId: source.sourceId }),
        ]
      }
      case 'prepare_b_roll_source': {
        if (this.#input.route !== 'existing_source') {
          throw new Error('Source preparation cannot run for a non-source B-roll route.')
        }
        const pipeline = await this.#ensureExistingPipeline()
        return [
          pipeline.executionKey,
          this.#input.plan.planHash,
          this.#input.source.artifactRef.sha256,
        ]
      }
      case 'generate_b_roll_candidate': {
        const attempt = await this.#ensureGeneratedAttempt()
        return [attempt.attemptEvidenceHash, attempt.output.sha256, attempt.cost.costEvidenceHash]
      }
      case 'inspect_b_roll_candidate_with_ffprobe': {
        if (this.#input.route === 'generated_injected') {
          const qa = await this.#ensureCandidateQa()
          return [qa.qaReport.technicalInspectionHash, qa.version.rawCandidate.sha256]
        }
        const inspection = await this.#ensureExistingInspection()
        return [
          inspection.sourceInspectionHash,
          inspection.inspectionStageHash,
        ]
      }
      case 'normalize_b_roll_candidate_with_ffmpeg': {
        if (this.#input.route === 'generated_injected') {
          const qa = await this.#ensureCandidateQa()
          return [qa.version.normalizedCandidate.sha256, qa.version.candidateVersionHash]
        }
        const normalization = await this.#ensureExistingNormalization()
        return [
          normalization.normalizedCandidate.sha256,
          normalization.normalizationStageHash,
          normalization.sourceQaReportHash,
        ]
      }
      case 'run_b_roll_technical_qa': {
        if (this.#input.route === 'generated_injected') {
          const qa = await this.#ensureCandidateQa()
          return [qa.qaReport.objectiveQaHash, qa.qaReport.qaReportHash]
        }
        const source = await this.#ensureExistingSource()
        return [source.receipt.sourceInspectionHash, source.receipt.sourceQaReportHash]
      }
      case 'run_b_roll_semantic_visual_qa': {
        if (this.#input.route === 'generated_injected') {
          const qa = await this.#ensureCandidateQa()
          if (
            this.#input.requirePublicDependencyAcceptance &&
            !this.#visualIntelligenceAcceptance
          ) throw new Error('Canonical private B-roll semantic QA lacks accepted Visual Intelligence evidence.')
          if (qa.qaReport.productionQualifiedSemanticQa) {
            throw new Error('Injected B-roll semantic evidence cannot be production-qualified.')
          }
          return [
            qa.qaReport.semanticObservationHash,
            qa.qaReport.qaReportHash,
            ...(this.#visualIntelligenceAcceptance
              ? [this.#visualIntelligenceAcceptance.acceptanceHash]
              : []),
          ]
        }
        const source = await this.#ensureExistingSource()
        return [source.receipt.sourceQaReportHash]
      }
      case 'prepare_b_roll_remotion_layer': {
        const prepared = await this.#ensurePreparedIntegration()
        return [
          prepared.layerManifest.layerManifestHash,
          prepared.layerManifest.selectedArtifact.normalizedArtifact.sha256,
        ]
      }
      case 'prepare_b_roll_remotion_preview_proxy_with_ffmpeg': {
        const prepared = await this.#ensurePreparedPreviewProxy()
        return [
          prepared.receipt.objectSha256,
          prepared.receipt.ffmpegAttestationHash,
          prepared.receipt.proxyReceiptHash,
        ]
      }
      case 'render_b_roll_preview': {
        const integration = await this.#ensureIntegration()
        return [integration.receipt.preview.sha256, integration.receipt.preview.remotionAttestationHash]
      }
      case 'run_b_roll_preview_qa': {
        const integration = await this.#ensureIntegration()
        return [integration.integrationQa.integrationQaHash, integration.receipt.preview.sha256]
      }
      case 'project_b_roll_result_receipt': {
        if (this.#input.route === 'professional_no_action') {
          const result = await this.#ensureNoActionResult()
          return [result.receipt.resultHash, result.receiptRef.sha256]
        }
        const integration = await this.#ensureIntegration()
        return [
          integration.receipt.resultHash,
          integration.layerManifest.layerManifestHash,
          integration.integrationQa.integrationQaHash,
        ]
      }
      default:
        throw new Error(`Canonical private B-roll adapter has no operation for ${definition.jobType}.`)
    }
  }

  async #projectOutputArtifact(
    definition: BrollCanonicalWorkDefinition,
    invocation: SkillJobRuntimeInvocation,
  ): Promise<{ artifactType: string; value: unknown }> {
    const cached = this.#outputArtifacts.get(invocation.workItemKey)
    if (cached) return cached
    const item = this.#input.workGraph.workItems.find((candidate) =>
      candidate.workItemKey === invocation.workItemKey)!
    const common = {
      ownerUserId: this.#input.assignment.ownerUserId,
      workspaceId: this.#input.assignment.workspaceId,
      projectId: this.#input.assignment.projectId,
      editSessionId: this.#input.assignment.editSessionId,
      assignmentId: this.#input.assignment.assignmentId,
      assignmentHash: this.#publicAssignmentHash(),
      manifestRef: this.#input.assignment.manifestRef,
    }
    const work = {
      planId: this.#input.plan.planId,
      planHash: this.#publicPlanHash(),
      workItemKey: invocation.workItemKey,
      workItemHash: invocation.workItemHash,
    }
    const approvedWork = {
      ...work,
      approvedWorkGraphHash: this.#input.approvedWorkGraphHash,
    }
    let value: unknown
    switch (definition.jobType) {
      case 'validate_b_roll_assignment':
        value = this.#input.assignment
        break
      case 'validate_b_roll_range_authority':
        value = this.#input.plan
        break
      case 'validate_b_roll_source':
        if (this.#input.route !== 'existing_source') {
          throw new Error('Source artifact projection is unavailable for this route.')
        }
        value = sourceMediaArtifactV1Schema.parse(this.#input.source.mediaManifest)
        break
      case 'prepare_b_roll_source': {
        if (this.#input.route !== 'existing_source') {
          throw new Error('Prepared source projection is unavailable for this route.')
        }
        const pipeline = await this.#ensureExistingPipeline()
        const sourceTrim = pipeline.sourceTrim
        const frameCount = sourceTrim.endFrameExclusive -
          sourceTrim.startFrameInclusive
        const [costEvidenceRef, usageEvidenceRef] = await Promise.all([
          putPrivateAuthorityJsonBlob({
            localStorageRoot: this.#input.localStorageRoot,
            value: {
              schemaVersion: 'b_roll_existing_source_planning_cost_evidence_v1',
              executionKey: pipeline.executionKey,
              actualToolCostMicros: 0,
              serviceFeeIncluded: false,
              billingAuthorityGranted: false,
            },
          }),
          putPrivateAuthorityJsonBlob({
            localStorageRoot: this.#input.localStorageRoot,
            value: {
              schemaVersion: 'b_roll_existing_source_selection_usage_evidence_v1',
              executionKey: pipeline.executionKey,
              sourceId: this.#input.source.sourceId,
              sourceArtifactSha256: this.#input.source.artifactRef.sha256,
              exactSourceTrim: sourceTrim,
              mediaToolExecuted: false,
              providerRequestCount: 0,
            },
          }),
        ])
        value = createBrollCandidateMediaManifest({
          schemaVersion: 'b_roll_candidate_media_manifest_v1',
          ...common,
          ...approvedWork,
          sourceClass: 'existing_project_source',
          providerOperationId: null,
          providerAttemptId: null,
          providerRoute: null,
          configuredModelAlias: null,
          acceptedRuntimeModel: null,
          candidateVersion: 1,
          privateObjectIdentityHash: hashSkillValue({
            kind: 'b_roll_approved_source_selection_v1',
            executionKey: pipeline.executionKey,
            sourceArtifactSha256: this.#input.source.artifactRef.sha256,
            sourceTrim,
          }),
          objectSha256: this.#input.source.mediaManifest.objectSha256,
          byteLength: this.#input.source.mediaManifest.byteLength,
          mimeType: 'video/mp4',
          container: 'mp4',
          durationSeconds: frameCount / sourceTrim.fps,
          frameCount,
          fps: sourceTrim.fps as 24 | 30,
          width: this.#input.source.mediaManifest.width,
          height: this.#input.source.mediaManifest.height,
          audioStreamPresent: false,
          sourceArtifactHashes: [this.#input.source.artifactRef.sha256],
          referenceArtifactHashes: [],
          generationClassification: 'source_verified',
          proofSafetyClassification: 'source_verified_not_generated_proof',
          costEvidenceRef,
          usageEvidenceRef,
          checksumReadbackVerified: true,
          privateOnly: true,
          publicDeliveryAllowed: false,
          automaticSelectionAllowed: false,
          timelineMutationAllowed: false,
        })
        break
      }
      case 'generate_b_roll_candidate': {
        if (this.#input.route !== 'generated_injected') {
          throw new Error('Generated media projection is unavailable for this route.')
        }
        const attempt = await this.#ensureGeneratedAttempt()
        const costEvidenceRef = await putPrivateAuthorityJsonBlob({
          localStorageRoot: this.#input.localStorageRoot,
          value: attempt.cost,
        })
        const usageEvidenceRef = await putPrivateAuthorityJsonBlob({
          localStorageRoot: this.#input.localStorageRoot,
          value: {
            schemaVersion: 'b_roll_injected_provider_usage_evidence_v1',
            attemptId: attempt.attemptId,
            attemptEvidenceHash: attempt.attemptEvidenceHash,
            generationSubmissionCount: attempt.generationSubmissionCount,
            automaticRetryCount: attempt.automaticRetryCount,
            alternateProviderFallbackCount: attempt.alternateProviderFallbackCount,
          },
        })
        const portrait = this.#input.requestPackage.output.aspectRatio === '9:16'
        value = createBrollCandidateMediaManifest({
          schemaVersion: 'b_roll_candidate_media_manifest_v1',
          ...common,
          ...approvedWork,
          sourceClass: this.#input.requestPackage.taskMode === 'edit_uploaded_video'
            ? 'gemini_omni_uploaded_video_edit'
            : 'gemini_omni_generated',
          providerOperationId: this.#input.requestPackage.operationId,
          providerAttemptId: attempt.attemptId,
          providerRoute: this.#input.requestPackage.providerRouteId,
          configuredModelAlias: this.#input.requestPackage.configuredModelAlias,
          acceptedRuntimeModel: 'injected_gemini_omni_v5_internal_fixture',
          candidateVersion: attempt.candidateVersionNumber,
          privateObjectIdentityHash: attempt.output.privateObjectIdentityHash,
          objectSha256: attempt.output.sha256,
          byteLength: attempt.output.byteLength,
          mimeType: 'video/mp4',
          container: 'mp4',
          durationSeconds: this.#input.requestPackage.output.durationSeconds,
          frameCount: this.#input.requestPackage.output.durationSeconds *
            this.#input.requestPackage.output.frameRate,
          fps: this.#input.requestPackage.output.frameRate,
          width: portrait ? 720 : 1_280,
          height: portrait ? 1_280 : 720,
          audioStreamPresent: false,
          sourceArtifactHashes: this.#input.requestPackage.sourceInputs.map((source) => source.sha256),
          referenceArtifactHashes: this.#input.requestPackage.sourceInputs
            .filter((source) => source.inputRole !== 'uploaded_video')
            .map((source) => source.sha256),
          generationClassification: this.#input.requestPackage.taskMode === 'edit_uploaded_video'
            ? 'provider_edited_source'
            : 'illustrative_generated',
          proofSafetyClassification: 'illustrative_not_verified_proof',
          costEvidenceRef,
          usageEvidenceRef,
          checksumReadbackVerified: true,
          privateOnly: true,
          publicDeliveryAllowed: false,
          automaticSelectionAllowed: false,
          timelineMutationAllowed: false,
        })
        break
      }
      case 'inspect_b_roll_candidate_with_ffprobe': {
        const media = this.#latestMediaManifest()
        if (this.#input.route === 'generated_injected') {
          const qa = await this.#ensureCandidateQa()
          value = createBrollCandidateManifest({
            schemaVersion: 'b_roll_candidate_manifest_v1',
            ...common,
            ...work,
            candidateMediaManifestHash: media.mediaManifestHash,
            technicalInspectionRef: qa.qaReport.technicalInspectionRef,
            technicalInspectionHash: qa.qaReport.technicalInspectionHash,
            objectiveQaRef: qa.qaReport.objectiveQaRef,
            objectiveQaHash: qa.qaReport.objectiveQaHash,
            durationSeconds: qa.version.durationSeconds,
            frameCount: qa.version.rawCandidate.frameCount,
            fps: qa.version.rawCandidate.frameRate,
            width: qa.version.rawCandidate.width,
            height: qa.version.rawCandidate.height,
            videoStreamCount: 1,
            audioStreamCount: 0,
            blackFrameRatioMillionths: 0,
            frozenFrameRatioMillionths: 0,
            maximumFrozenRunFrames: 0,
            checksumVerified: true,
            privateIntegrityVerified: true,
            status: 'passed',
          })
        } else {
          if (this.#input.route !== 'existing_source') {
            throw new Error('Candidate inspection projection is unavailable for this route.')
          }
          const inspection = await this.#ensureExistingInspection()
          const sourceTrim = (await this.#ensureExistingPipeline()).sourceTrim
          const frameCount = sourceTrim.endFrameExclusive -
            sourceTrim.startFrameInclusive
          value = createBrollCandidateManifest({
            schemaVersion: 'b_roll_candidate_manifest_v1',
            ...common,
            ...work,
            candidateMediaManifestHash: media.mediaManifestHash,
            technicalInspectionRef: inspection.sourceInspectionRef,
            technicalInspectionHash: inspection.sourceInspectionHash,
            objectiveQaRef: inspection.sourceInspectionRef,
            objectiveQaHash: inspection.inspectionStageHash,
            durationSeconds: frameCount / sourceTrim.fps,
            frameCount,
            fps: sourceTrim.fps as 24 | 30,
            width: this.#input.source.mediaManifest.width,
            height: this.#input.source.mediaManifest.height,
            videoStreamCount: inspection.videoStreamCount,
            audioStreamCount: inspection.audioStreamCount,
            blackFrameRatioMillionths: 0,
            frozenFrameRatioMillionths: 0,
            maximumFrozenRunFrames: 0,
            checksumVerified: true,
            privateIntegrityVerified: true,
            status: 'passed',
          })
        }
        break
      }
      case 'normalize_b_roll_candidate_with_ffmpeg':
        if (this.#input.route === 'generated_injected') {
          value = (await this.#ensureCandidateQa()).version
        } else {
          if (this.#input.route !== 'existing_source') {
            throw new Error('Candidate normalization projection is unavailable for this route.')
          }
          const normalization = await this.#ensureExistingNormalization()
          const media = this.#latestMediaManifest()
          value = createBrollExistingSourceCandidateVersion({
            schemaVersion: 'b_roll_candidate_version_v1',
            versionKind: 'existing_source_prepared',
            ...common,
            ...approvedWork,
            candidateMediaManifestHash: media.mediaManifestHash,
            sourceArtifactHash: this.#input.source.artifactRef.sha256,
            normalizedPrivateObjectIdentityHash:
              normalization.normalizedCandidate.privateObjectIdentityHash,
            normalizedObjectSha256: normalization.normalizedCandidate.sha256,
            byteLength: normalization.normalizedCandidate.byteLength,
            mimeType: 'video/x-nut',
            container: 'nut',
            videoCodec: 'ffv1',
            frameCount: normalization.normalizedCandidate.frameCount,
            fps: normalization.normalizedCandidate.frameRate,
            exactRange: this.#input.assignment.writeRangeAuthority.authorizedRange,
            sourceQaReportHash: normalization.sourceQaReportHash,
            automaticSelectionAllowed: false,
            outsideAuthorizedRangeModified: false,
            immutable: true,
          })
        }
        break
      case 'run_b_roll_technical_qa':
      case 'run_b_roll_semantic_visual_qa':
      case 'run_b_roll_preview_qa': {
        if (this.#input.route === 'professional_no_action') {
          throw new Error('Runtime QA projection is unavailable for a no-action route.')
        }
        const preview = definition.jobType === 'run_b_roll_preview_qa'
        const semantic = definition.jobType === 'run_b_roll_semantic_visual_qa'
        const integration = preview ? await this.#ensureIntegration() : undefined
        let subjectArtifactHash: string
        let evidenceHashes: string[]
        if (preview) {
          subjectArtifactHash = integration!.receipt.preview.sha256
          evidenceHashes = [
            integration!.integrationQa.integrationQaHash,
            integration!.receipt.preview.sha256,
          ]
        } else if (this.#input.route === 'generated_injected') {
          const qa = await this.#ensureCandidateQa()
          subjectArtifactHash = qa.qaReport.normalizedCandidateSha256
          evidenceHashes = [
            qa.qaReport.qaReportHash,
            semantic ? qa.qaReport.semanticObservationHash : qa.qaReport.objectiveQaHash,
          ]
        } else {
          const qa = await this.#ensureExistingSource()
          subjectArtifactHash = qa.receipt.normalizedCandidate.sha256
          evidenceHashes = [qa.receipt.sourceQaReportHash, qa.receipt.sourceInspectionHash]
        }
        value = createBrollRuntimeQaReport({
          schemaVersion: 'b_roll_qa_report_v1',
          ...common,
          ...work,
          qaClass: preview
            ? 'preview_integration'
            : semantic
              ? 'candidate_semantic'
              : this.#input.route === 'existing_source'
                ? 'source_technical'
                : 'candidate_technical',
          subjectArtifactHash,
          validatorVersion: `b_roll.runtime.${definition.jobType}.v1`,
          evidenceHashes: [
            ...evidenceHashes,
            ...(semantic && this.#visualIntelligenceAcceptance
              ? [this.#visualIntelligenceAcceptance.acceptanceHash]
              : []),
          ],
          disposition: 'passed',
          privateInternalOnly: true,
          productionQualified: false,
          outsideAuthorizedRangeModified: false,
          evaluatedAt: (this.#input.now ?? (() => new Date().toISOString()))(),
        })
        break
      }
      case 'prepare_b_roll_remotion_layer':
        value = (await this.#ensurePreparedIntegration()).layerManifest
        break
      case 'prepare_b_roll_remotion_preview_proxy_with_ffmpeg': {
        const prepared = await this.#ensurePreparedPreviewProxy()
        value = createBrollRemotionPreviewProxyManifest({
          schemaVersion: 'b_roll_remotion_preview_proxy_manifest_v1',
          ...common,
          ...approvedWork,
          sourceNormalizedSha256: prepared.receipt.normalizedSha256,
          privateObjectIdentityHash: prepared.receipt.privateObjectIdentityHash,
          objectSha256: prepared.receipt.objectSha256,
          byteLength: prepared.receipt.byteLength,
          mimeType: 'video/x-matroska',
          container: 'matroska',
          frameCount: prepared.receipt.frameCount,
          fps: prepared.receipt.fps,
          ffmpegRequestHash: prepared.receipt.ffmpegRequestHash,
          ffmpegAttestationHash: prepared.receipt.ffmpegAttestationHash,
          checksumReadbackVerified: true,
          technicalProxyOnly: true,
          creativeColorTransformApplied: false,
          audioRemoved: true,
          privateOnly: true,
          publicDeliveryAllowed: false,
          finalCustomerExport: false,
          outsideAuthorizedRangeModified: false,
        })
        break
      }
      case 'render_b_roll_preview': {
        const integration = await this.#ensureIntegration()
        value = createBrollPrivatePreviewMediaManifest({
          schemaVersion: 'b_roll_private_preview_media_manifest_v1',
          ...common,
          ...approvedWork,
          layerManifestHash: integration.layerManifest.layerManifestHash,
          privateObjectIdentityHash:
            integration.receipt.preview.previewArtifactIdentityHash,
          objectSha256: integration.receipt.preview.sha256,
          byteLength: integration.receipt.preview.byteLength,
          mimeType: 'video/mp4',
          container: 'mp4',
          durationSeconds: integration.receipt.preview.frameCount /
            integration.receipt.preview.frameRate,
          frameCount: integration.receipt.preview.frameCount,
          fps: integration.receipt.preview.frameRate,
          width: integration.receipt.preview.width,
          height: integration.receipt.preview.height,
          remotionRequestHash: integration.receipt.preview.remotionRequestHash,
          remotionAttestationHash: integration.receipt.preview.remotionAttestationHash,
          checksumReadbackVerified: true,
          privateOnly: true,
          publicDeliveryAllowed: false,
          finalCustomerExport: false,
          outsideAuthorizedRangeModified: false,
        })
        break
      }
      case 'project_b_roll_result_receipt':
        value = this.#input.route === 'professional_no_action'
          ? (await this.#ensureNoActionResult()).receipt
          : (await this.#ensureIntegration()).receipt
        break
      default:
        throw new Error(`Canonical private B-roll has no output projection for ${definition.jobType}.`)
    }
    const projected = { artifactType: item.expectedOutputType, value }
    this.#outputArtifacts.set(invocation.workItemKey, projected)
    return projected
  }

  #latestMediaManifest(): ReturnType<typeof createBrollCandidateMediaManifest> {
    const item = [...this.#input.workGraph.workItems].reverse().find((candidate) =>
      ['prepare_b_roll_source', 'generate_b_roll_candidate'].includes(candidate.jobType))
    const artifact = item ? this.#outputArtifacts.get(item.workItemKey) : undefined
    if (!artifact) throw new Error('Canonical private B-roll media manifest dependency is missing.')
    return artifact.value as ReturnType<typeof createBrollCandidateMediaManifest>
  }

  async #ensureAuthority() {
    if (this.#state.validatedAuthority) return this.#state.validatedAuthority
    const assignment = assertBrollAssignment({
      assignment: this.#input.assignment,
      manifest: BROLL_CAPABILITY_MANIFEST,
    })
    assertBrollPlanningContext({ assignment, context: this.#input.context })
    assertBrollCanonicalWorkGraph(this.#input.workGraph)
    const authority = await revalidateCanonicalBrollPlanAuthority({
      localStorageRoot: this.#input.localStorageRoot,
      component: this.#input.component,
      canonicalWorkItems: this.#input.canonicalWorkItems,
    })
    const persistedComponent = await readPrivateAuthorityJsonBlob({
      localStorageRoot: this.#input.localStorageRoot,
      ref: this.#input.componentRef,
    })
    if (
      Array.isArray(persistedComponent) ||
      stableAuthorityStringify(persistedComponent) !==
        stableAuthorityStringify(this.#input.component) ||
      authority.assignment?.assignmentHash !== assignment.assignmentHash ||
      authority.context?.contextHash !== this.#input.context.contextHash ||
      authority.plan?.planHash !== this.#input.plan.planHash ||
      authority.planningQaReport?.reportHash !== this.#input.planningQaReport.reportHash ||
      authority.workGraph?.workGraphHash !== this.#input.workGraph.workGraphHash
    ) throw new Error('Canonical private B-roll authority revalidation lost exact lineage.')
    this.#assertOwnership()
    this.#state.validatedAuthority = authority
    return authority
  }

  #assertOwnership(): void {
    const ownership = brollVisualOwnershipManifestSchema.parse(this.#input.visualOwnership)
    const range = this.#input.assignment.writeRangeAuthority.authorizedRange
    const overlaps = ownership.ownershipWindows.filter((window) =>
      frameRangesOverlap(window.frameRange, range))
    const primaryOwners = [...new Set(overlaps
      .filter((window) => window.ownership === 'primary')
      .map((window) => window.ownerSkillKey))]
    if (
      ownership.assignmentId !== this.#input.assignment.assignmentId ||
      ownership.ownerUserId !== this.#input.assignment.ownerUserId ||
      ownership.workspaceId !== this.#input.assignment.workspaceId ||
      ownership.projectId !== this.#input.assignment.projectId ||
      hashSkillValue(ownership.assignmentRange) !== hashSkillValue(range) ||
      ownership.requestedOwnership !== this.#input.assignment.requestedVisualOwnership ||
      (this.#input.assignment.requestedVisualOwnership === 'primary' && overlaps.some((window) =>
        window.ownership === 'primary' && window.exclusive && window.ownerSkillKey !== 'b_roll')) ||
      (this.#input.context.primaryVisualOwner
        ? !primaryOwners.includes(this.#input.context.primaryVisualOwner)
        : primaryOwners.length > 0)
    ) throw new Error('Canonical private B-roll ownership authority is stale or conflicting.')
  }

  async #ensureExistingPipeline(): Promise<BrollExistingSourceExecutionPipeline> {
    if (this.#state.existingPipeline) return this.#state.existingPipeline
    await this.#ensureAuthority()
    if (this.#input.route !== 'existing_source') {
      throw new Error('Canonical private B-roll source execution is unavailable for this route.')
    }
    this.#state.existingPipeline =
      await createBrollExistingSourceExecutionPipeline({
      localStorageRoot: this.#input.localStorageRoot,
      gate: this.#input.executionGate,
      component: this.#input.component,
      canonicalWorkItems: this.#input.canonicalWorkItems,
      source: this.#input.source,
      mediaRuntime: this.#input.mediaRuntime,
      providerObserver: this.#input.providerObserver,
      now: this.#input.now,
    })
    return this.#state.existingPipeline
  }

  async #ensureExistingInspection(): Promise<BrollExistingSourceInspectionStage> {
    if (this.#state.existingInspection) return this.#state.existingInspection
    const pipeline = await this.#ensureExistingPipeline()
    this.#state.existingInspection = await pipeline.inspect()
    return this.#state.existingInspection
  }

  async #ensureExistingNormalization(): Promise<BrollExistingSourceNormalizationStage> {
    if (this.#state.existingNormalization) {
      return this.#state.existingNormalization
    }
    const pipeline = await this.#ensureExistingPipeline()
    this.#state.existingNormalization = await pipeline.normalize()
    return this.#state.existingNormalization
  }

  async #ensureExistingSource(): Promise<ExistingExecution> {
    if (this.#state.existing) return this.#state.existing
    const pipeline = await this.#ensureExistingPipeline()
    this.#state.existing = await pipeline.finalize()
    if (this.#state.existing.receipt.providerRequestCount !== 0) {
      throw new Error('Existing-source B-roll execution recorded a provider request.')
    }
    return this.#state.existing
  }

  async #ensureGeneratedAttempt(): Promise<BrollCandidateAttemptEvidence> {
    if (this.#state.initialAttempt) return this.#state.initialAttempt
    await this.#ensureAuthority()
    if (this.#input.route !== 'generated_injected') {
      throw new Error('Injected B-roll provider lifecycle is unavailable for this route.')
    }
    const lifecycleInput = {
      localStorageRoot: this.#input.localStorageRoot,
      authorization: this.#input.authorization,
      requestPackage: this.#input.requestPackage,
      workerIdentity: this.#input.workerIdentity,
      dispatchSecret: this.#input.dispatchSecret,
      leaseDurationMs: this.#input.leaseDurationMs,
      times: this.#input.lifecycleTimes,
      outcome: {
        state: 'succeeded' as const,
        outputId: this.#input.candidate.outputId,
        bytes: this.#input.candidate.bytes,
        infrastructureCostMicros: this.#input.candidate.infrastructureCostMicros,
        rawInfrastructureUsageEvidenceDigest:
          this.#input.candidate.rawInfrastructureUsageEvidenceDigest,
      },
    }
    const first = await executePrivateInjectedBrollProviderLifecycleV5(lifecycleInput)
    const replay = await executePrivateInjectedBrollProviderLifecycleV5(lifecycleInput)
    if (
      first.disposition !== 'executed' || replay.disposition !== 'completed_replay' ||
      !first.consumerReceipt || !replay.consumerReceipt ||
      first.state.stateHash !== replay.state.stateHash ||
      first.state.cost.actualProviderRequestCount !== 0 ||
      first.state.liveProviderCallMade || first.state.output?.providerGenerated !== false
    ) throw new Error('Injected B-roll provider lifecycle failed execution/replay authority.')
    this.#state.initialAttempt = createInitialInjectedBrollCandidateAttemptEvidence({
      state: first.state,
      consumerReceipt: first.consumerReceipt,
      requestPackage: this.#input.requestPackage,
      injectedInteractionIdDigest: this.#input.candidate.injectedInteractionIdDigest,
    })
    return this.#state.initialAttempt
  }

  async #ensureCandidateQa(): Promise<CandidateQaExecution> {
    if (this.#state.candidateQa) return this.#state.candidateQa
    const attempt = await this.#ensureGeneratedAttempt()
    if (this.#input.route !== 'generated_injected') {
      throw new Error('Generated B-roll candidate QA is unavailable for this route.')
    }
    if (
      this.#input.requirePublicDependencyAcceptance &&
      (!this.#visualIntelligenceAcceptance || !this.#visualIntelligenceArtifact)
    ) throw new Error('Canonical private B-roll candidate QA lacks accepted Visual Intelligence evidence.')
    const semanticObservation = this.#visualIntelligenceArtifact
      ? createBrollSemanticVisualObservation({
          schemaVersion: 'b_roll_semantic_visual_observation_v1',
          candidateSha256: attempt.output.sha256,
          assignmentHash: this.#input.assignment.assignmentHash,
          planHash: this.#input.plan.planHash,
          conceptKey: this.#input.plan.shotSpecification!.conceptKey,
          authorizedRangeHash: hashSkillValue(
            this.#input.assignment.writeRangeAuthority.authorizedRange,
          ),
          observationSource: 'internal_injected_visual_observation_v1',
          testOnly: true,
          evidenceArtifactHash: this.#visualIntelligenceArtifact.qaArtifactHash,
          confidenceMillionths: this.#visualIntelligenceArtifact.confidenceMillionths,
          checks: brollSemanticChecksFromVisualIntelligence(
            this.#visualIntelligenceArtifact,
          ),
          needsUserConfirmation: false,
          generatedMediaTreatedAsVerifiedProof: false,
          automaticSelectionAllowed: false,
          productionQualified: false,
        })
      : this.#input.candidate.semanticObservation
    this.#state.candidateQa = await executeBrollCandidateQa({
      localStorageRoot: this.#input.localStorageRoot,
      assignment: this.#input.assignment,
      context: this.#input.context,
      plan: this.#input.plan,
      requestPackage: this.#input.requestPackage,
      attemptEvidence: attempt,
      candidateBytes: this.#input.candidate.bytes,
      semanticObservation,
      mediaRuntime: this.#input.mediaRuntime,
      now: this.#input.now,
    })
    if (!['accepted', 'accepted_after_normalization'].includes(
      this.#state.candidateQa.qaReport.verdict,
    )) throw new Error('Canonical private B-roll candidate did not pass real output QA.')
    return this.#state.candidateQa
  }

  async #ensurePreparedIntegration(): Promise<BrollPreparedRemotionLayer> {
    if (this.#state.preparedIntegration) {
      return this.#state.preparedIntegration
    }
    if (this.#input.route === 'professional_no_action') {
      throw new Error('Professional no-action B-roll cannot prepare a layer.')
    }
    const selection = this.#input.route === 'generated_injected'
      ? await this.#candidateSelection()
      : await this.#existingSelection()
    this.#state.preparedIntegration =
      await prepareBrollRemotionLayerManifest({
        localStorageRoot: this.#input.localStorageRoot,
        assignment: this.#input.assignment,
        assignmentRef: this.#input.component.assignmentArtifactRef,
        plan: this.#input.plan,
        planRef: this.#input.component.planArtifactRef,
        selection,
        captionOverlay: this.#input.captionOverlay,
        ...(this.#input.trackGraph
          ? { trackGraph: this.#input.trackGraph }
          : {}),
      })
    return this.#state.preparedIntegration
  }

  async #ensurePreparedPreviewProxy(): Promise<BrollPreparedRemotionPreviewProxy> {
    if (this.#state.preparedPreviewProxy) {
      return this.#state.preparedPreviewProxy
    }
    if (this.#input.route === 'professional_no_action') {
      throw new Error('Professional no-action B-roll cannot prepare a preview proxy.')
    }
    const selection = this.#input.route === 'generated_injected'
      ? await this.#candidateSelection()
      : await this.#existingSelection()
    await this.#ensurePreparedIntegration()
    this.#state.preparedPreviewProxy = await prepareBrollRemotionPreviewProxy({
      localStorageRoot: this.#input.localStorageRoot,
      assignment: this.#input.assignment,
      assignmentRef: this.#input.component.assignmentArtifactRef,
      plan: this.#input.plan,
      planRef: this.#input.component.planArtifactRef,
      selection,
      mediaRuntime: this.#input.mediaRuntime,
      idempotencyKey: `b-roll-preview-proxy-${this.#input.approvalHash}`,
    })
    return this.#state.preparedPreviewProxy
  }

  async #ensureIntegration(): Promise<RemotionExecution> {
    if (this.#state.integration) return this.#state.integration
    if (this.#input.route === 'professional_no_action') {
      throw new Error('Professional no-action B-roll cannot enter Remotion integration.')
    }
    const selection = this.#input.route === 'generated_injected'
      ? await this.#candidateSelection()
      : await this.#existingSelection()
    const preparedPreviewProxy = await this.#ensurePreparedPreviewProxy()
    this.#state.integration = await executeBrollRemotionIntegration({
      localStorageRoot: this.#input.localStorageRoot,
      assignment: this.#input.assignment,
      assignmentRef: this.#input.component.assignmentArtifactRef,
      plan: this.#input.plan,
      planRef: this.#input.component.planArtifactRef,
      selection,
      captionOverlay: this.#input.captionOverlay,
      ...(this.#input.trackGraph ? { trackGraph: this.#input.trackGraph } : {}),
      mediaRuntime: this.#input.mediaRuntime,
      remotionRuntime: this.#input.remotionRuntime,
      preparedPreviewProxy,
      integrationInfrastructureCostMicros:
        this.#input.integrationInfrastructureCostMicros,
      idempotencyKey: `b-roll-integration-${this.#input.approvalHash}`,
      now: this.#input.now,
    })
    const prepared = await this.#ensurePreparedIntegration()
    if (
      this.#state.integration.layerManifest.layerManifestHash !==
        prepared.layerManifest.layerManifestHash ||
      stableAuthorityStringify(this.#state.integration.layerManifestRef) !==
        stableAuthorityStringify(prepared.layerManifestRef) ||
      this.#state.integration.receipt.outsideAuthorizedRangeModified ||
      this.#state.integration.integrationQa.status !== 'passed' ||
      !this.#state.integration.receipt.preview.privateInternalOnly
    ) throw new Error('Canonical private B-roll Remotion integration failed closed.')
    return this.#state.integration
  }

  async #candidateSelection() {
    if (this.#input.route !== 'generated_injected') {
      throw new Error('Generated selection is unavailable for this route.')
    }
    const qa = await this.#ensureCandidateQa()
    const normalized = await readCanonicalPrivateMediaArtifact({
      localStorageRoot: this.#input.localStorageRoot,
      privateObjectIdentityHash: qa.version.normalizedCandidate.privateObjectIdentityHash,
    })
    if (!normalized || normalized.sha256 !== qa.version.normalizedCandidate.sha256) {
      throw new Error('Canonical private B-roll normalized candidate is missing or stale.')
    }
    return {
      kind: 'candidate' as const,
      candidateVersion: qa.version,
      candidateVersionRef: qa.versionRef,
      qaReport: qa.qaReport,
      qaReportRef: qa.qaReportRef,
      normalizedBytes: normalized.bytes,
      attemptHistory: [await this.#ensureGeneratedAttempt()],
    }
  }

  async #existingSelection() {
    if (this.#input.route !== 'existing_source') {
      throw new Error('Existing-source selection is unavailable for this route.')
    }
    const existing = await this.#ensureExistingSource()
    const normalized = await readCanonicalPrivateMediaArtifact({
      localStorageRoot: this.#input.localStorageRoot,
      privateObjectIdentityHash: existing.receipt.normalizedCandidate.privateObjectIdentityHash,
    })
    if (!normalized || normalized.sha256 !== existing.receipt.normalizedCandidate.sha256) {
      throw new Error('Canonical private B-roll prepared source is missing or stale.')
    }
    return {
      kind: 'existing_source' as const,
      receipt: existing.receipt,
      receiptRef: existing.receiptRef,
      normalizedBytes: normalized.bytes,
      attemptHistory: [] as const,
    }
  }

  async #ensureNoActionResult() {
    if (this.#state.noAction) return this.#state.noAction
    await this.#ensureAuthority()
    if (
      this.#input.route !== 'professional_no_action' ||
      !['use_no_broll', 'needs_other_skill', 'needs_user_confirmation', 'blocked']
      .includes(this.#input.plan.decision) ||
      this.#input.plan.providerRequestPlanned ||
      this.#input.plan.providerCreditEstimate !== 0 ||
      this.#input.plan.creditEstimate !== 0 ||
      this.#input.workGraph.workItems.some((item) =>
        ['prepare_b_roll_source', 'generate_b_roll_candidate',
          'normalize_b_roll_candidate_with_ffmpeg',
          'prepare_b_roll_remotion_preview_proxy_with_ffmpeg',
          'render_b_roll_preview']
          .includes(item.jobType))
    ) throw new Error('Canonical private B-roll no-action result has executable media work.')
    const receipt = createBrollCanonicalNoActionResultReceipt({
      schemaVersion: 'b_roll_result_receipt_v1',
      resultKind: 'professional_no_action',
      manifestRef: this.#input.assignment.manifestRef,
      assignmentId: this.#input.assignment.assignmentId,
      assignmentHash: this.#publicAssignmentHash(),
      planId: this.#input.plan.planId,
      planHash: this.#publicPlanHash(),
      planningQaReportHash: this.#input.planningQaReport.reportHash,
      workGraphHash: this.#input.approvedWorkGraphHash,
      exactTiming: this.#input.assignment.writeRangeAuthority.authorizedRange,
      decision: this.#input.plan.decision as
        BrollCanonicalNoActionResultReceipt['decision'],
      providerRequestCount: 0,
      mediaArtifactCount: 0,
      estimatedProviderCredits: 0,
      selectedSource: null,
      displayLayer: null,
      outsideAuthorizedRangeModified: false,
      privateInternalOnly: true,
    })
    const receiptRef = await putPrivateAuthorityJsonBlob({
      localStorageRoot: this.#input.localStorageRoot,
      value: receipt,
    })
    this.#state.noAction = { receipt, receiptRef }
    return this.#state.noAction
  }
}
