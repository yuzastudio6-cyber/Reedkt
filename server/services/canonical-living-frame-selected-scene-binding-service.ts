import type {
  LivingFrameSelectedSceneAdmission,
} from '../../src/types/living-frame-selected-scene-admission'
import type {
  LivingFrameSemanticPlanProjection,
} from '../../src/types/living-frame-semantic-plan-projection'
import {
  CANONICAL_LIVING_FRAME_SELECTED_SCENE_ADMISSION_COMPONENT_KEY,
  CANONICAL_LIVING_FRAME_SELECTED_SCENE_COMPONENT_KEY,
  CANONICAL_LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_COMPONENT_KEY,
  type CanonicalLivingFrameSelectedSceneBinding,
  type CanonicalLivingFrameSelectedScenePublication,
  type CanonicalLivingFrameSelectedSceneSelectorDecision,
} from '../../src/types/living-frame-selected-scene-binding'
import {
  compileCanonicalLivingFrameSelectedSceneBinding,
  verifyCanonicalLivingFrameSelectedSceneBinding,
} from '../living-frame/canonical-living-frame-selected-scene-binding'
import type { ServiceContext } from '../types'
import type { CanonicalPlanComponentsInput } from
  '../validation/edit-planning-authority-schemas'
import type {
  CanonicalPlanningHandoffPublicationBinding,
} from '../validation/canonical-planning-handoff-schemas'
import {
  canonicalLivingFrameSelectedSceneBindingSchema,
} from '../validation/canonical-living-frame-selected-scene-binding-schemas'
import { ApiError } from '../errors/api-error'
import {
  type AuthorityJsonBlobRef,
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_LIVING_FRAME_SELECTED_SCENE_SELECTOR_PORT_VERSION =
  'canonical-living-frame-selected-scene-selector-port-v1' as const

export interface CanonicalLivingFrameSelectedSceneSelectorRequest {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_SELECTED_SCENE_SELECTOR_PORT_VERSION
  readonly source:
    'canonical_living_frame_selected_scene_binding_service'
  readonly identity: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly handoffId: string
    readonly handoffHash: string
    readonly canonicalPlanComponentsHash: string
  }
  readonly sourceBindings: {
    readonly deferredLivingFrameComponentDigestSha256: string
    readonly semanticPlanProjectionDigestSha256: string
    readonly selectedSceneAdmissionDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
  }
  readonly candidateScenes: LivingFrameSelectedSceneAdmission[
    'candidateScenes'
  ]
  readonly deliberateNonUse: boolean
  readonly browserSelectionAuthority: false
  readonly rawChatProvided: false
  readonly estimateApprovalSnapshotAuthorityGranted: false
  readonly workToolProviderRuntimeAuthorityGranted: false
}

export interface CanonicalLivingFrameSelectedSceneSelectorPort {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_SELECTED_SCENE_SELECTOR_PORT_VERSION
  readonly source:
    'server_injected_canonical_living_frame_scene_selector'
  readonly evidenceClass:
    'private_internal_process_bound_scene_selector'
  readonly browserCallable: false
  readonly productionAuthority: false
  select(
    request: CanonicalLivingFrameSelectedSceneSelectorRequest,
  ): Promise<unknown>
}

export interface CanonicalLivingFrameSelectedScenePublicationRefs {
  readonly [CANONICAL_LIVING_FRAME_SELECTED_SCENE_COMPONENT_KEY]:
    AuthorityJsonBlobRef
  readonly [CANONICAL_LIVING_FRAME_SELECTED_SCENE_ADMISSION_COMPONENT_KEY]:
    AuthorityJsonBlobRef
  readonly [
    CANONICAL_LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_COMPONENT_KEY
  ]: AuthorityJsonBlobRef
}

const admittedSelectorPorts = new WeakSet<object>()

export function createCanonicalLivingFrameSelectedSceneSelectorPort(
  select: CanonicalLivingFrameSelectedSceneSelectorPort['select'],
): CanonicalLivingFrameSelectedSceneSelectorPort {
  if (typeof select !== 'function') {
    throw unavailable(
      'Canonical Living Frame selected-scene authority requires a process-bound selector.',
    )
  }
  const port = Object.freeze({
    schemaVersion:
      CANONICAL_LIVING_FRAME_SELECTED_SCENE_SELECTOR_PORT_VERSION,
    source:
      'server_injected_canonical_living_frame_scene_selector' as const,
    evidenceClass:
      'private_internal_process_bound_scene_selector' as const,
    browserCallable: false as const,
    productionAuthority: false as const,
    select: select.bind(undefined),
  })
  admittedSelectorPorts.add(port)
  return port
}

export async function selectCanonicalLivingFrameScenes(input: {
  readonly identity:
    CanonicalLivingFrameSelectedSceneSelectorRequest['identity']
  readonly components: CanonicalPlanComponentsInput
  readonly semanticPlanProjection: LivingFrameSemanticPlanProjection
  readonly admission: LivingFrameSelectedSceneAdmission
  readonly selectorPort:
    | CanonicalLivingFrameSelectedSceneSelectorPort
    | null
    | undefined
}): Promise<CanonicalLivingFrameSelectedScenePublication> {
  assertSelectorPort(input.selectorPort)
  const request = createSelectorRequest(input)
  const requestDigest = sha256AuthorityValue(request)
  const decision = await input.selectorPort.select(
    deepFreeze(structuredClone(request)),
  )
  if (sha256AuthorityValue(request) !== requestDigest) {
    throw conflict(
      'Canonical Living Frame selector mutated its server-owned request.',
    )
  }
  const binding = await compileCanonicalLivingFrameSelectedSceneBinding({
    identity: input.identity,
    components: input.components,
    semanticPlanProjection: input.semanticPlanProjection,
    admission: input.admission,
    decision:
      decision as CanonicalLivingFrameSelectedSceneSelectorDecision,
  })
  return {
    binding,
    admission: structuredClone(input.admission),
    semanticPlanProjection:
      structuredClone(input.semanticPlanProjection),
  }
}

export async function prepareCanonicalLivingFrameSelectedScenePublication(
  input: {
    readonly publication: unknown
    readonly expectedScope: {
      readonly workspaceId: string
      readonly projectId: string
      readonly editSessionId: string
    }
    readonly components: CanonicalPlanComponentsInput
    readonly planningHandoffBinding:
      CanonicalPlanningHandoffPublicationBinding | undefined
  },
): Promise<CanonicalLivingFrameSelectedScenePublication> {
  if (!input.planningHandoffBinding) {
    throw conflict(
      'Canonical Living Frame selected-scene publication requires the exact persisted planning handoff.',
    )
  }
  if (
    !isRecord(input.publication)
    || !hasExactKeys(input.publication, [
      'binding',
      'admission',
      'semanticPlanProjection',
    ])
  ) {
    throw invalid(
      'Canonical Living Frame selected-scene publication is invalid.',
    )
  }
  const bindingValue = input.publication.binding
  const admissionValue = input.publication.admission
  const projectionValue = input.publication.semanticPlanProjection
  if (!isRecord(bindingValue) || !isRecord(admissionValue)
    || !isRecord(projectionValue)) {
    throw invalid(
      'Canonical Living Frame selected-scene publication components are invalid.',
    )
  }
  const parsedBinding =
    canonicalLivingFrameSelectedSceneBindingSchema.safeParse(bindingValue)
  if (!parsedBinding.success) {
    throw invalid(
      'Canonical Living Frame selected-scene binding schema is invalid.',
    )
  }
  const binding =
    parsedBinding.data as CanonicalLivingFrameSelectedSceneBinding
  const admission =
    admissionValue as unknown as LivingFrameSelectedSceneAdmission
  const semanticPlanProjection =
    projectionValue as unknown as LivingFrameSemanticPlanProjection
  const verified = await verifyCanonicalLivingFrameSelectedSceneBinding({
    binding,
    components: input.components,
    semanticPlanProjection,
    admission,
  })
  if (!verified.ok) {
    throw conflict(
      'Canonical Living Frame selected-scene publication failed full source revalidation.',
    )
  }
  const identity = verified.binding.identity
  const expectedComponentsHash = sha256AuthorityValue(input.components)
  if (
    identity.workspaceId !== input.expectedScope.workspaceId
    || identity.projectId !== input.expectedScope.projectId
    || identity.editSessionId !== input.expectedScope.editSessionId
    || identity.handoffId !== input.planningHandoffBinding.handoffId
    || identity.handoffHash !== input.planningHandoffBinding.handoffHash
    || identity.canonicalPlanComponentsHash !== expectedComponentsHash
    || input.planningHandoffBinding.canonicalPlanComponentsHash !==
      expectedComponentsHash
  ) {
    throw conflict(
      'Canonical Living Frame selected-scene publication is stale for the current plan or handoff.',
    )
  }
  return {
    binding: verified.binding,
    admission: structuredClone(admission),
    semanticPlanProjection: structuredClone(semanticPlanProjection),
  }
}

export async function persistCanonicalLivingFrameSelectedScenePublication(
  input: {
    readonly context: ServiceContext
    readonly publication: CanonicalLivingFrameSelectedScenePublication
  },
): Promise<CanonicalLivingFrameSelectedScenePublicationRefs> {
  const [bindingRef, admissionRef, projectionRef] = await Promise.all([
    putPrivateAuthorityJsonBlob({
      localStorageRoot: input.context.env.localStorageRoot,
      value:
        input.publication.binding as unknown as Record<string, unknown>,
      maxBytes: 2 * 1024 * 1024,
    }),
    putPrivateAuthorityJsonBlob({
      localStorageRoot: input.context.env.localStorageRoot,
      value:
        input.publication.admission as Record<string, unknown>,
      maxBytes: 2 * 1024 * 1024,
    }),
    putPrivateAuthorityJsonBlob({
      localStorageRoot: input.context.env.localStorageRoot,
      value:
        input.publication.semanticPlanProjection as Record<string, unknown>,
      maxBytes: 2 * 1024 * 1024,
    }),
  ])
  return {
    [CANONICAL_LIVING_FRAME_SELECTED_SCENE_COMPONENT_KEY]:
      bindingRef,
    [CANONICAL_LIVING_FRAME_SELECTED_SCENE_ADMISSION_COMPONENT_KEY]:
      admissionRef,
    [CANONICAL_LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_COMPONENT_KEY]:
      projectionRef,
  }
}

export async function loadCanonicalLivingFrameSelectedScenePublication(
  input: {
    readonly context: ServiceContext
    readonly componentRefs: Record<string, AuthorityJsonBlobRef>
    readonly expectedScope: {
      readonly workspaceId: string
      readonly projectId: string
      readonly editSessionId: string
    }
    readonly components: CanonicalPlanComponentsInput
    readonly planningHandoffBinding:
      CanonicalPlanningHandoffPublicationBinding | undefined
  },
): Promise<CanonicalLivingFrameSelectedScenePublication | undefined> {
  const keys = [
    CANONICAL_LIVING_FRAME_SELECTED_SCENE_COMPONENT_KEY,
    CANONICAL_LIVING_FRAME_SELECTED_SCENE_ADMISSION_COMPONENT_KEY,
    CANONICAL_LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_COMPONENT_KEY,
  ] as const
  const presentKeys = keys.filter((key) => input.componentRefs[key])
  if (presentKeys.length === 0) return undefined
  if (presentKeys.length !== keys.length) {
    throw conflict(
      'Canonical Living Frame selected-scene component lineage is incomplete.',
    )
  }
  const [binding, admission, semanticPlanProjection] = await Promise.all(
    keys.map((key) => readPrivateAuthorityJsonBlob({
      localStorageRoot: input.context.env.localStorageRoot,
      ref: input.componentRefs[key]!,
    })),
  )
  return prepareCanonicalLivingFrameSelectedScenePublication({
    publication: { binding, admission, semanticPlanProjection },
    expectedScope: input.expectedScope,
    components: input.components,
    planningHandoffBinding: input.planningHandoffBinding,
  })
}

export function canonicalLivingFrameSelectedScenePublicationDigest(
  publication: CanonicalLivingFrameSelectedScenePublication | undefined,
): string | null {
  return publication?.binding.bindingDigestSha256 ?? null
}

function createSelectorRequest(input: {
  readonly identity:
    CanonicalLivingFrameSelectedSceneSelectorRequest['identity']
  readonly semanticPlanProjection: LivingFrameSemanticPlanProjection
  readonly admission: LivingFrameSelectedSceneAdmission
}): CanonicalLivingFrameSelectedSceneSelectorRequest {
  return {
    schemaVersion:
      CANONICAL_LIVING_FRAME_SELECTED_SCENE_SELECTOR_PORT_VERSION,
    source:
      'canonical_living_frame_selected_scene_binding_service',
    identity: { ...input.identity },
    sourceBindings: {
      deferredLivingFrameComponentDigestSha256:
        input.admission.sourceBindings
          .deferredLivingFrameComponentDigestSha256,
      semanticPlanProjectionDigestSha256:
        input.semanticPlanProjection.projectionDigestSha256,
      selectedSceneAdmissionDigestSha256:
        input.admission.admissionDigestSha256,
      confirmedOutputFrameDigestSha256:
        input.admission.sourceBindings
          .outputFrameExpectationDigestSha256,
      currentMasterTimingDigestSha256:
        input.admission.sourceBindings
          .masterTimingExpectationDigestSha256,
    },
    candidateScenes: structuredClone(input.admission.candidateScenes),
    deliberateNonUse: input.admission.deliberateNonUse,
    browserSelectionAuthority: false,
    rawChatProvided: false,
    estimateApprovalSnapshotAuthorityGranted: false,
    workToolProviderRuntimeAuthorityGranted: false,
  }
}

function assertSelectorPort(
  port:
    | CanonicalLivingFrameSelectedSceneSelectorPort
    | null
    | undefined,
): asserts port is CanonicalLivingFrameSelectedSceneSelectorPort {
  if (
    !port
    || !admittedSelectorPorts.has(port)
    || port.schemaVersion !==
      CANONICAL_LIVING_FRAME_SELECTED_SCENE_SELECTOR_PORT_VERSION
    || port.source !==
      'server_injected_canonical_living_frame_scene_selector'
    || port.evidenceClass !==
      'private_internal_process_bound_scene_selector'
    || port.browserCallable !== false
    || port.productionAuthority !== false
    || typeof port.select !== 'function'
  ) {
    throw unavailable(
      'Canonical Living Frame selected-scene authority requires an admitted process-bound selector.',
    )
  }
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).sort().join('|') === [...keys].sort().join('|')
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate:
      'canonical_living_frame_selected_scene_binding_validation',
  })
}

function conflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409, {
    requiredGate:
      'canonical_living_frame_selected_scene_binding_revalidation',
  })
}

function unavailable(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate:
      'canonical_living_frame_selected_scene_process_bound_selector',
  })
}
