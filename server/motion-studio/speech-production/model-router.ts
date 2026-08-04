import type {
  MotionStudioSpeechCapabilitySnapshotV1,
  MotionStudioSpeechModelCapabilityV1,
  MotionStudioSpeechModelId,
  MotionStudioSpeechModelRole,
  MotionStudioSpeechModelSelectionV1,
  MotionStudioSpeechResolvedRouteV1,
} from '../../../src/types/motion-studio'
import { motionStudioSpeechCapabilitySnapshotV1Schema } from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'

const modelForRole: Record<MotionStudioSpeechModelRole, MotionStudioSpeechModelId> = {
  final_expressive: 'eleven_v3',
  stability_fallback: 'eleven_multilingual_v2',
  audition_or_temporary: 'eleven_flash_v2_5',
}

export function resolveMotionStudioSpeechProtocolRoute(input: {
  selection: MotionStudioSpeechModelSelectionV1
  capabilitySnapshot: MotionStudioSpeechCapabilitySnapshotV1
}): MotionStudioSpeechResolvedRouteV1 {
  const snapshot = motionStudioSpeechCapabilitySnapshotV1Schema.safeParse(input.capabilitySnapshot)
  if (!snapshot.success) throw invalid('Speech capability snapshot is invalid.', snapshot.error.flatten())
  if (snapshot.data.discoveryKind !== 'protocol_fixture' || snapshot.data.externalDiscoveryPerformed) {
    throw blocked('The local Speech Gateway protocol route requires non-live protocol capability evidence.')
  }
  const selectedModelId = input.selection.setting === 'explicit'
    ? input.selection.requestedModelId
    : modelForRole[input.selection.intendedRole]
  if (!selectedModelId) throw invalid('Explicit speech model selection is missing its model identity.')
  if (modelForRole[input.selection.intendedRole] !== selectedModelId) {
    throw blocked('Speech model selection does not match its approved production role.')
  }
  const capability = snapshot.data.models.find((entry) => entry.modelId === selectedModelId)
  if (!capability || capability.availability !== 'protocol_fixture_only') {
    throw blocked('Speech model is not eligible for the local protocol route.')
  }
  return {
    setting: input.selection.setting,
    intendedRole: input.selection.intendedRole,
    selectedModelId,
    capabilitySnapshotId: snapshot.data.capabilitySnapshotId,
    capabilitySnapshotDigest: snapshot.data.evidenceDigest,
    resolutionReason: input.selection.setting === 'auto'
      ? `Auto selected the approved ${humanRole(input.selection.intendedRole)} protocol route.`
      : `The explicit approved ${humanRole(input.selection.intendedRole)} protocol route was selected.`,
    protocolFixtureOnly: true,
    externalExecutionEligible: false,
    fallbackPerformed: false,
  }
}

export function requireMotionStudioSpeechProtocolModelCapability(input: {
  route: MotionStudioSpeechResolvedRouteV1
  capabilitySnapshot: MotionStudioSpeechCapabilitySnapshotV1
}): MotionStudioSpeechModelCapabilityV1 {
  if (
    input.route.capabilitySnapshotId !== input.capabilitySnapshot.capabilitySnapshotId ||
    input.route.capabilitySnapshotDigest !== input.capabilitySnapshot.evidenceDigest
  ) throw blocked('Resolved speech route does not bind the exact capability snapshot.')
  const capability = input.capabilitySnapshot.models.find((entry) => entry.modelId === input.route.selectedModelId)
  if (!capability) throw blocked('Resolved speech route has no exact model capability evidence.')
  return capability
}

function humanRole(role: MotionStudioSpeechModelRole): string {
  return role.replaceAll('_', ' ')
}

function invalid(message: string, details?: unknown): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, details)
}

function blocked(message: string): ApiError {
  return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
