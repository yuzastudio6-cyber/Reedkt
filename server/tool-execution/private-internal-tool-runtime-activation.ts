import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import type { ProductionToolId } from '../tool-registry'
import {
  activatePrivateOfflineAiCapabilityRuntime,
  readPersistedOfflineAiCapabilityRuntimeAuthority,
} from './ai-capability-execution'
import {
  activatePrivateOfflineAudioFluxAnalysisRuntime,
  readPersistedOfflineAudioFluxAnalysisRuntimeAuthority,
} from './audioflux-analysis-execution'
import {
  activatePrivateOfflineBrowserGraphicsRuntime,
  readPersistedOfflineBrowserGraphicsRuntimeAuthority,
} from './browser-graphics-execution'
import {
  activatePrivateOfflineContainerPackagingValidationRuntime,
  readPersistedOfflineContainerPackagingValidationRuntimeAuthority,
} from './container-packaging-validation-execution'
import {
  activatePrivateOfflineDeepFilterNetVoiceCleanupRuntime,
  readPersistedOfflineDeepFilterNetVoiceCleanupRuntimeAuthority,
} from './deepfilternet-voice-cleanup-execution'
import {
  activatePrivateOfflineLibassCaptionRuntime,
  readPersistedOfflineLibassRuntimeAuthority,
} from './libass-caption-execution'
import {
  activatePrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
} from './media-binary-execution'
import {
  activatePrivateOfflineNativeAudioProcessingRuntime,
  readPersistedOfflineNativeAudioProcessingRuntimeAuthority,
} from './native-audio-processing-execution'
import {
  activatePrivateOfflineNativeImagePipelineRuntime,
  readPersistedOfflineNativeImagePipelineRuntimeAuthority,
} from './native-image-pipeline-execution'
import {
  activatePrivateOfflineNodeStructuredExecutionRuntime,
  readPersistedOfflineNodeStructuredRuntimeAuthority,
} from './node-runner-execution'
import {
  activatePrivateOfflinePythonStructuredExecutionRuntime,
  readPersistedOfflinePythonStructuredRuntimeAuthority,
} from './python-runner-execution'
import {
  listProvenToolIdentityCatalog,
  PROVEN_TOOL_EVIDENCE_REVISION,
  type ProvenToolRunnerClass,
} from './proven-tool-identity-catalog'
import {
  activatePrivateOfflineRembgBackgroundRemovalRuntime,
  readPersistedOfflineRembgBackgroundRemovalRuntimeAuthority,
} from './rembg-background-removal-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
  readPersistedOfflineRemotionRenderRuntimeAuthority,
} from './remotion-render-execution'
import {
  activatePrivateOfflineVapourSynthFramePipelineRuntime,
  readPersistedOfflineVapourSynthFramePipelineRuntimeAuthority,
} from './vapoursynth-frame-pipeline-execution'

export const PRIVATE_INTERNAL_TOOL_RUNTIME_ACTIVATION_VERSION =
  'private-internal-tool-runtime-activation-v1' as const

export interface PrivateInternalToolRuntimeActivationTool {
  toolId: ProductionToolId
  operationId: string
  runnerClass: ProvenToolRunnerClass
  runtimeFamily: string
  status: 'ready_for_private_internal_execution'
}

export interface PrivateInternalToolRuntimeActivationFamily {
  runtimeFamily: string
  runnerClasses: readonly ProvenToolRunnerClass[]
  authorityHash: string
  imageIdentityHash: string
  canonicalToolIds: readonly ProductionToolId[]
  status: 'ready'
}

export interface PrivateInternalToolRuntimeActivationReport {
  schemaVersion: typeof PRIVATE_INTERNAL_TOOL_RUNTIME_ACTIVATION_VERSION
  evidenceRevision: typeof PROVEN_TOOL_EVIDENCE_REVISION
  observedAt: string
  canonicalToolCount: number
  runnerClassCount: number
  runtimeAuthorityCount: number
  tools: readonly PrivateInternalToolRuntimeActivationTool[]
  runtimeFamilies: readonly PrivateInternalToolRuntimeActivationFamily[]
  readiness: {
    allCanonicalToolsReady: true
    privateInternalExecutionReady: true
    productReady: false
    externalBetaReady: false
    productionReady: false
  }
  blockers: readonly string[]
  reportHash: string
}

interface RuntimeAuthorityShape {
  authorityHash: string
  image: {
    imageIdentityHash: string
  }
  supportedOperations: readonly {
    toolId: string
    operationId: string
  }[]
  readiness: {
    privateInternalExecutionReady: boolean
    exactStructuredPayloadOnly: boolean
    canonicalDispatchMayReference: boolean
    productReady: boolean
    externalBetaReady: boolean
    productionReady: boolean
  }
}

interface RuntimeFamilyDefinition {
  runtimeFamily: string
  runnerClasses: readonly ProvenToolRunnerClass[]
  activate(): Promise<unknown>
  read(): Promise<unknown>
}

const RUNTIME_FAMILIES = Object.freeze([
  runtimeFamily(
    'structured_node',
    [
      'offline_node_structured_execution_v1',
      'offline_sharp_structured_execution_v1',
    ],
    activatePrivateOfflineNodeStructuredExecutionRuntime,
    readPersistedOfflineNodeStructuredRuntimeAuthority,
  ),
  runtimeFamily(
    'structured_python',
    ['offline_python_structured_execution_v1'],
    activatePrivateOfflinePythonStructuredExecutionRuntime,
    readPersistedOfflinePythonStructuredRuntimeAuthority,
  ),
  runtimeFamily(
    'media_binary',
    ['offline_media_binary_execution_v1'],
    activatePrivateOfflineMediaBinaryRuntime,
    readPersistedOfflineMediaBinaryRuntimeAuthority,
  ),
  runtimeFamily(
    'remotion_render',
    ['offline_remotion_render_execution_v1'],
    activatePrivateOfflineRemotionRenderRuntime,
    readPersistedOfflineRemotionRenderRuntimeAuthority,
  ),
  runtimeFamily(
    'libass_caption',
    ['offline_libass_caption_execution_v1'],
    activatePrivateOfflineLibassCaptionRuntime,
    readPersistedOfflineLibassRuntimeAuthority,
  ),
  runtimeFamily(
    'browser_graphics',
    ['offline_browser_graphics_execution_v1'],
    activatePrivateOfflineBrowserGraphicsRuntime,
    readPersistedOfflineBrowserGraphicsRuntimeAuthority,
  ),
  runtimeFamily(
    'ai_capability',
    ['offline_ai_capability_execution_v1'],
    activatePrivateOfflineAiCapabilityRuntime,
    readPersistedOfflineAiCapabilityRuntimeAuthority,
  ),
  runtimeFamily(
    'native_image_pipeline',
    ['offline_native_image_pipeline_execution_v1'],
    activatePrivateOfflineNativeImagePipelineRuntime,
    readPersistedOfflineNativeImagePipelineRuntimeAuthority,
  ),
  runtimeFamily(
    'native_audio_processing',
    ['offline_native_audio_processing_execution_v1'],
    activatePrivateOfflineNativeAudioProcessingRuntime,
    readPersistedOfflineNativeAudioProcessingRuntimeAuthority,
  ),
  runtimeFamily(
    'container_packaging_validation',
    ['offline_container_packaging_validation_execution_v1'],
    activatePrivateOfflineContainerPackagingValidationRuntime,
    readPersistedOfflineContainerPackagingValidationRuntimeAuthority,
  ),
  runtimeFamily(
    'vapoursynth_frame_pipeline',
    ['offline_vapoursynth_frame_pipeline_execution_v1'],
    activatePrivateOfflineVapourSynthFramePipelineRuntime,
    readPersistedOfflineVapourSynthFramePipelineRuntimeAuthority,
  ),
  runtimeFamily(
    'audioflux_analysis',
    ['offline_audioflux_analysis_execution_v1'],
    activatePrivateOfflineAudioFluxAnalysisRuntime,
    readPersistedOfflineAudioFluxAnalysisRuntimeAuthority,
  ),
  runtimeFamily(
    'rembg_background_removal',
    ['offline_rembg_background_removal_execution_v1'],
    activatePrivateOfflineRembgBackgroundRemovalRuntime,
    readPersistedOfflineRembgBackgroundRemovalRuntimeAuthority,
  ),
  runtimeFamily(
    'deepfilternet_voice_cleanup',
    ['offline_deepfilternet_voice_cleanup_execution_v1'],
    activatePrivateOfflineDeepFilterNetVoiceCleanupRuntime,
    readPersistedOfflineDeepFilterNetVoiceCleanupRuntimeAuthority,
  ),
] as const satisfies readonly RuntimeFamilyDefinition[])

const RELEASE_BLOCKERS = Object.freeze([
  'distributed_worker_and_service_identity_not_verified',
  'deployed_private_storage_and_observability_not_verified',
  'product_external_beta_and_production_promotion_not_verified',
] as const)

let activeProcessReportHash: string | undefined

export async function activateCompletePrivateInternalToolRuntimeSet():
Promise<PrivateInternalToolRuntimeActivationReport> {
  if (arguments.length !== 0) {
    throw validationFailure('Complete private tool runtime activation accepts no caller input.')
  }
  for (const family of RUNTIME_FAMILIES) {
    try {
      await family.activate()
    } catch (cause) {
      throw new ApiError(
        'TOOL_NOT_READY',
        `Verified private runtime family "${family.runtimeFamily}" could not be activated.`,
        503,
        { runtimeFamily: family.runtimeFamily },
        { cause },
      )
    }
  }
  const report = await inspectCompletePrivateInternalToolRuntimeSet()
  activeProcessReportHash = report.reportHash
  return report
}

export async function inspectCompletePrivateInternalToolRuntimeSet():
Promise<PrivateInternalToolRuntimeActivationReport> {
  if (arguments.length !== 0) {
    throw validationFailure('Complete private tool runtime inspection accepts no caller input.')
  }
  const observedFamilies = await Promise.all(
    RUNTIME_FAMILIES.map(async (definition) => ({
      definition,
      authority: runtimeAuthority(
        definition.runtimeFamily,
        await definition.read(),
      ),
    })),
  )
  const catalog = listProvenToolIdentityCatalog()
  const tools = catalog.map((record): PrivateInternalToolRuntimeActivationTool => {
    if (
      record.callability !== 'callable_candidate'
      || !record.runtime.runnerClass
      || !record.readiness.privateInternalRunnerReady
      || !record.readiness.privateInternalEndToEndReady
      || !record.readiness.privateInternalJobAdapterReady
    ) {
      throw notReady(
        `Canonical tool "${record.canonicalToolId}" lacks complete private execution evidence.`,
        record.canonicalToolId,
      )
    }
    const matches = observedFamilies.filter(({ authority, definition }) =>
      definition.runnerClasses.includes(record.runtime.runnerClass!)
      && authority.supportedOperations.some((operation) =>
        operation.toolId === record.canonicalToolId
        && operation.operationId === record.operationId))
    if (matches.length !== 1) {
      throw notReady(
        `Canonical tool "${record.canonicalToolId}" must resolve to exactly one activated runtime authority.`,
        record.canonicalToolId,
      )
    }
    return Object.freeze({
      toolId: record.canonicalToolId,
      operationId: record.operationId,
      runnerClass: record.runtime.runnerClass,
      runtimeFamily: matches[0]!.definition.runtimeFamily,
      status: 'ready_for_private_internal_execution' as const,
    })
  })
  if (new Set(tools.map((tool) => tool.toolId)).size !== catalog.length) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Activated private tool set contains a duplicate or missing canonical identity.',
      503,
    )
  }

  const runtimeFamilies = observedFamilies.map(
    ({ authority, definition }): PrivateInternalToolRuntimeActivationFamily =>
      Object.freeze({
        runtimeFamily: definition.runtimeFamily,
        runnerClasses: definition.runnerClasses,
        authorityHash: authority.authorityHash,
        imageIdentityHash: authority.image.imageIdentityHash,
        canonicalToolIds: tools
          .filter((tool) => tool.runtimeFamily === definition.runtimeFamily)
          .map((tool) => tool.toolId),
        status: 'ready' as const,
      }),
  )
  const core = {
    schemaVersion: PRIVATE_INTERNAL_TOOL_RUNTIME_ACTIVATION_VERSION,
    evidenceRevision: PROVEN_TOOL_EVIDENCE_REVISION,
    canonicalToolCount: tools.length,
    runnerClassCount: new Set(tools.map((tool) => tool.runnerClass)).size,
    runtimeAuthorityCount: runtimeFamilies.length,
    tools,
    runtimeFamilies,
    readiness: {
      allCanonicalToolsReady: true as const,
      privateInternalExecutionReady: true as const,
      productReady: false as const,
      externalBetaReady: false as const,
      productionReady: false as const,
    },
    blockers: RELEASE_BLOCKERS,
  }
  const report = Object.freeze({
    ...core,
    observedAt: new Date().toISOString(),
    reportHash: sha256AuthorityValue(core),
  })
  return report
}

export async function inspectActivePrivateInternalToolRuntimeSet():
Promise<PrivateInternalToolRuntimeActivationReport> {
  if (arguments.length !== 0) {
    throw validationFailure(
      'Active private tool runtime inspection accepts no caller input.',
    )
  }
  if (!activeProcessReportHash) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'The current server process has not activated the complete private internal tool runtime set.',
      503,
      { requiredGate: 'private_internal_tool_runtime_process_activation' },
    )
  }
  const report = await inspectCompletePrivateInternalToolRuntimeSet()
  if (report.reportHash !== activeProcessReportHash) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'The current server process runtime authority set changed after activation.',
      503,
      { requiredGate: 'private_internal_tool_runtime_process_reactivation' },
    )
  }
  return report
}

function runtimeFamily(
  runtimeFamilyId: string,
  runnerClasses: readonly ProvenToolRunnerClass[],
  activate: () => Promise<unknown>,
  read: () => Promise<unknown>,
): RuntimeFamilyDefinition {
  return Object.freeze({
    runtimeFamily: runtimeFamilyId,
    runnerClasses: Object.freeze([...runnerClasses]),
    activate,
    read,
  })
}

function runtimeAuthority(
  runtimeFamilyId: string,
  value: unknown,
): RuntimeAuthorityShape {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(
      'TOOL_NOT_READY',
      `Verified private runtime authority "${runtimeFamilyId}" is absent.`,
      503,
      { runtimeFamily: runtimeFamilyId },
    )
  }
  const authority = value as Partial<RuntimeAuthorityShape>
  if (
    typeof authority.authorityHash !== 'string'
    || !/^[a-f0-9]{64}$/u.test(authority.authorityHash)
    || !authority.image
    || typeof authority.image.imageIdentityHash !== 'string'
    || !/^[a-f0-9]{64}$/u.test(authority.image.imageIdentityHash)
    || !Array.isArray(authority.supportedOperations)
    || !authority.readiness
    || authority.readiness.privateInternalExecutionReady !== true
    || authority.readiness.exactStructuredPayloadOnly !== true
    || authority.readiness.canonicalDispatchMayReference !== true
    || authority.readiness.productReady !== false
    || authority.readiness.externalBetaReady !== false
    || authority.readiness.productionReady !== false
  ) {
    throw new ApiError(
      'TOOL_NOT_READY',
      `Verified private runtime authority "${runtimeFamilyId}" failed its readiness boundary.`,
      503,
      { runtimeFamily: runtimeFamilyId },
    )
  }
  const operations = authority.supportedOperations.map((operation) => {
    if (
      !operation
      || typeof operation !== 'object'
      || typeof operation.toolId !== 'string'
      || typeof operation.operationId !== 'string'
    ) {
      throw new ApiError(
        'TOOL_NOT_READY',
        `Verified private runtime authority "${runtimeFamilyId}" has an invalid operation binding.`,
        503,
        { runtimeFamily: runtimeFamilyId },
      )
    }
    return Object.freeze({
      toolId: operation.toolId,
      operationId: operation.operationId,
    })
  })
  return Object.freeze({
    authorityHash: authority.authorityHash,
    image: Object.freeze({
      imageIdentityHash: authority.image.imageIdentityHash,
    }),
    supportedOperations: Object.freeze(operations),
    readiness: Object.freeze({
      privateInternalExecutionReady: true,
      exactStructuredPayloadOnly: true,
      canonicalDispatchMayReference: true,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
    }),
  })
}

function notReady(message: string, toolId: ProductionToolId): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, { toolId })
}

function validationFailure(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400)
}

export function privateInternalToolRuntimeActivationSemanticDigest(
  report: PrivateInternalToolRuntimeActivationReport,
): string {
  return sha256AuthorityValue({
    schemaVersion: report.schemaVersion,
    evidenceRevision: report.evidenceRevision,
    canonicalToolCount: report.canonicalToolCount,
    runnerClassCount: report.runnerClassCount,
    runtimeAuthorityCount: report.runtimeAuthorityCount,
    tools: report.tools,
    runtimeFamilies: report.runtimeFamilies,
    readiness: report.readiness,
    blockers: report.blockers,
    stable: stableAuthorityStringify(report.tools),
  })
}
