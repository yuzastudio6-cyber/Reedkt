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
  executeBrollExistingSource,
  type BrollExistingSourceExecutionReceipt,
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
  type BrollIntegrationQaReport,
  type BrollRemotionLayerManifest,
  type BrollResultReceipt,
} from './b-roll-remotion-integration'
import type { BrollSemanticVisualObservation } from './mini-skills/candidate-qa-director'
import {
  assertBrollCanonicalWorkGraph,
  type BrollCanonicalWorkDefinition,
  type BrollCanonicalWorkGraph,
} from './b-roll-work-graph-compiler'
import type {
  SkillJobRuntimeAdapterResult,
  SkillJobRuntimeInvocation,
} from '../core/edit-skill-runtime-binding'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import type { EditSkillArtifactReference } from '../core/edit-skill-artifact-store'
import type { CanonicalWorkItemInput } from '../../validation/edit-planning-authority-schemas'
import type {
  BrollProviderInjectedLifecycleTimesV5,
  BrollProviderWorkAuthorizationV5,
  BrollProviderRequestPackageV5,
} from '../../providers/google/gemini-omni-broll'
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

type FullMediaRuntime = Pick<
  PrivateOfflineMediaBinaryRuntime,
  'execute' | 'executeServerInjected' | 'executeVisualCalibrationObjectiveQaServerInjected'
>

interface BrollCanonicalPrivateCommonInput {
  localStorageRoot: string
  approvalHash: string
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
      source: {
        sourceId: string
        artifactRef: EditSkillArtifactReference
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

type ExistingExecution = Awaited<ReturnType<typeof executeBrollExistingSource>>
type CandidateQaExecution = Awaited<ReturnType<typeof executeBrollCandidateQa>>
type RemotionExecution = Awaited<ReturnType<typeof executeBrollRemotionIntegration>>

interface BrollCanonicalPrivateExecutionState {
  validatedAuthority?: Awaited<ReturnType<typeof revalidateCanonicalBrollPlanAuthority>>
  existing?: ExistingExecution
  initialAttempt?: BrollCandidateAttemptEvidence
  candidateQa?: CandidateQaExecution
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

  constructor(input: BrollCanonicalPrivateExecutionInput) {
    this.#input = input
    if (!/^[a-f0-9]{64}$/u.test(input.approvalHash)) {
      throw new Error('Canonical private B-roll execution requires an exact approval hash.')
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
      outsideAuthorizedRangeModified: false,
    })
    const result: SkillJobRuntimeAdapterResult = {
      status: 'succeeded',
      outputArtifactTypes: [definition.output],
      evidenceHashes: [...new Set([...evidenceHashes, operationEvidenceHash])],
      providerRequestCount: 0,
      publicArtifactCount: 0,
      productionMutationCount: 0,
    }
    this.#results.set(invocation.workItemKey, result)
    this.#completed.add(invocation.workItemKey)
    return result
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
      invocation.assignmentHash !== this.#input.assignment.assignmentHash ||
      invocation.binding.jobType !== definition.jobType ||
      invocation.binding.operationId !== definition.operationId ||
      invocation.binding.workerClass !== definition.workerClass ||
      invocation.authorizedPhase !== definition.allowedPhase ||
      !item || item.jobType !== definition.jobType ||
      item.operationId !== definition.operationId ||
      item.workerClass !== definition.workerClass ||
      item.workItemHash !== invocation.workItemHash ||
      hashSkillValue(item.authorizedRange) !==
        hashSkillValue(this.#input.assignment.writeRangeAuthority.authorizedRange)
    ) throw new Error('Canonical private B-roll adapter rejected stale or unbound work.')
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
        if (
          this.#input.plan.sourceCandidateId !== source.sourceId ||
          hashSkillValue(this.#input.plan.sourceArtifactRef) !== hashSkillValue(source.artifactRef) ||
          source.bytes.byteLength !== source.artifactRef.byteLength ||
          createHash('sha256').update(source.bytes).digest('hex') !== source.artifactRef.sha256
        ) throw new Error('Canonical private B-roll source selection is stale.')
        return [source.artifactRef.sha256, hashSkillValue({ sourceId: source.sourceId })]
      }
      case 'prepare_b_roll_source': {
        const execution = await this.#ensureExistingSource()
        return [
          execution.receipt.resultHash,
          execution.receipt.normalizedCandidate.sha256,
          execution.receipt.sourceQaReportHash,
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
        const source = await this.#ensureExistingSource()
        return [source.receipt.sourceInspectionHash, source.receipt.selectedSourceArtifactRef.sha256]
      }
      case 'normalize_b_roll_candidate_with_ffmpeg': {
        if (this.#input.route === 'generated_injected') {
          const qa = await this.#ensureCandidateQa()
          return [qa.version.normalizedCandidate.sha256, qa.version.candidateVersionHash]
        }
        const source = await this.#ensureExistingSource()
        return [source.receipt.normalizedCandidate.sha256, source.receipt.resultHash]
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
          if (qa.qaReport.productionQualifiedSemanticQa) {
            throw new Error('Injected B-roll semantic evidence cannot be production-qualified.')
          }
          return [qa.qaReport.semanticObservationHash, qa.qaReport.qaReportHash]
        }
        const source = await this.#ensureExistingSource()
        return [source.receipt.sourceQaReportHash]
      }
      case 'prepare_b_roll_remotion_layer': {
        const integration = await this.#ensureIntegration()
        return [integration.layerManifest.layerManifestHash, integration.receipt.selectedArtifact.normalizedArtifact.sha256]
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

  async #ensureExistingSource(): Promise<ExistingExecution> {
    if (this.#state.existing) return this.#state.existing
    await this.#ensureAuthority()
    if (this.#input.route !== 'existing_source') {
      throw new Error('Canonical private B-roll source execution is unavailable for this route.')
    }
    const componentRef = this.#input.componentRef
    this.#state.existing = await executeBrollExistingSource({
      localStorageRoot: this.#input.localStorageRoot,
      gate: {
        approvedPlanSnapshotId: `b-roll-private-${this.#input.approvalHash.slice(0, 20)}`,
        snapshotHash: hashSkillValue({ approvalHash: this.#input.approvalHash }),
        reservationId: `b-roll-private-reservation-${this.#input.approvalHash.slice(0, 16)}`,
        reservationStatus: 'reserved',
        approved: true,
        privateInternalExecution: true,
        idempotencyKey: `b-roll-source-${this.#input.approvalHash}`,
        componentRef,
        snapshotComponentRef: componentRef,
        executionPackageComponentRef: componentRef,
      },
      component: this.#input.component,
      canonicalWorkItems: this.#input.canonicalWorkItems,
      source: this.#input.source,
      mediaRuntime: this.#input.mediaRuntime,
      providerObserver: this.#input.providerObserver,
      now: this.#input.now,
    })
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
    this.#state.candidateQa = await executeBrollCandidateQa({
      localStorageRoot: this.#input.localStorageRoot,
      assignment: this.#input.assignment,
      context: this.#input.context,
      plan: this.#input.plan,
      requestPackage: this.#input.requestPackage,
      attemptEvidence: attempt,
      candidateBytes: this.#input.candidate.bytes,
      semanticObservation: this.#input.candidate.semanticObservation,
      mediaRuntime: this.#input.mediaRuntime,
      now: this.#input.now,
    })
    if (!['accepted', 'accepted_after_normalization'].includes(
      this.#state.candidateQa.qaReport.verdict,
    )) throw new Error('Canonical private B-roll candidate did not pass real output QA.')
    return this.#state.candidateQa
  }

  async #ensureIntegration(): Promise<RemotionExecution> {
    if (this.#state.integration) return this.#state.integration
    if (this.#input.route === 'professional_no_action') {
      throw new Error('Professional no-action B-roll cannot enter Remotion integration.')
    }
    const selection = this.#input.route === 'generated_injected'
      ? await this.#candidateSelection()
      : await this.#existingSelection()
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
      integrationInfrastructureCostMicros:
        this.#input.integrationInfrastructureCostMicros,
      idempotencyKey: `b-roll-integration-${this.#input.approvalHash}`,
      now: this.#input.now,
    })
    if (
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
          'normalize_b_roll_candidate_with_ffmpeg', 'render_b_roll_preview']
          .includes(item.jobType))
    ) throw new Error('Canonical private B-roll no-action result has executable media work.')
    const receipt = createBrollCanonicalNoActionResultReceipt({
      schemaVersion: 'b_roll_result_receipt_v1',
      resultKind: 'professional_no_action',
      manifestRef: this.#input.assignment.manifestRef,
      assignmentId: this.#input.assignment.assignmentId,
      assignmentHash: this.#input.assignment.assignmentHash,
      planId: this.#input.plan.planId,
      planHash: this.#input.plan.planHash,
      planningQaReportHash: this.#input.planningQaReport.reportHash,
      workGraphHash: this.#input.workGraph.workGraphHash,
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
