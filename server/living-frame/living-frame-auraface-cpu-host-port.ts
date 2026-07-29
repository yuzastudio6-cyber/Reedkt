import {
  registerLivingFrameAuraFaceCpuCanonicalMountHostSessionPort,
  registerLivingFrameAuraFaceCpuHostPort,
  registerLivingFrameAuraFaceCpuModelBindingPort,
  registerLivingFrameAuraFaceCpuPrivateInputPort,
  registerLivingFrameAuraFaceCpuSafetyAdmissionPort,
  type LivingFrameAuraFaceCpuHostExecutionInput,
  type LivingFrameAuraFaceCpuHostExecutionResult,
  type LivingFrameAuraFaceCpuHostPort,
  type LivingFrameAuraFaceCpuCanonicalMountHostSessionInput,
  type LivingFrameAuraFaceCpuCanonicalMountHostSessionPort,
  type LivingFrameAuraFaceCpuCanonicalMountHostSessionResult,
  type LivingFrameAuraFaceCpuModelBindingPacket,
  type LivingFrameAuraFaceCpuModelBindingPort,
  type LivingFrameAuraFaceCpuPrivateInputPacket,
  type LivingFrameAuraFaceCpuPrivateInputPort,
  type LivingFrameAuraFaceCpuSafetyAdmissionPacket,
  type LivingFrameAuraFaceCpuSafetyAdmissionPort,
} from './living-frame-auraface-cpu-runtime'

export function createLivingFrameAuraFaceControlledFixtureAtomicMountHostSessionPort(
  executeOne: (
    input: LivingFrameAuraFaceCpuCanonicalMountHostSessionInput,
  ) => Promise<LivingFrameAuraFaceCpuCanonicalMountHostSessionResult>,
): LivingFrameAuraFaceCpuCanonicalMountHostSessionPort {
  assertFunction(executeOne)
  return registerLivingFrameAuraFaceCpuCanonicalMountHostSessionPort(
    Object.freeze({
      portClass:
        'controlled_fixture_auraface_atomic_mount_host_session_port_v1' as const,
      callerLocatorAccepted: false as const,
      callerPathAccepted: false as const,
      callerBytesAccepted: false as const,
      callerUrlAccepted: false as const,
      callerEndpointAccepted: false as const,
      externalNetworkAllowed: false as const,
      runtimeDownloadsAllowed: false as const,
      atomicMountAndInferenceRequired: true as const,
      productionQualified: false as const,
      executeOne: executeOne.bind(undefined),
    }),
  )
}

export function createLivingFrameAuraFaceControlledFixtureInputPort(
  readOnce: () => Promise<
    LivingFrameAuraFaceCpuPrivateInputPacket
  >,
): LivingFrameAuraFaceCpuPrivateInputPort {
  assertFunction(readOnce)
  return registerLivingFrameAuraFaceCpuPrivateInputPort(
    Object.freeze({
      portClass:
        'controlled_fixture_auraface_input_port_v1' as const,
      callerBytesAccepted: false as const,
      callerPathAccepted: false as const,
      callerUrlAccepted: false as const,
      browserShareable: false as const,
      productionQualified: false as const,
      readOnce: readOnce.bind(undefined),
    }),
  )
}

export function createLivingFrameAuraFacePrivateInputPort(
  readOnce: () => Promise<
    LivingFrameAuraFaceCpuPrivateInputPacket
  >,
): LivingFrameAuraFaceCpuPrivateInputPort {
  assertFunction(readOnce)
  return registerLivingFrameAuraFaceCpuPrivateInputPort(
    Object.freeze({
      portClass:
        'private_server_owned_auraface_input_port_v1' as const,
      callerBytesAccepted: false as const,
      callerPathAccepted: false as const,
      callerUrlAccepted: false as const,
      browserShareable: false as const,
      productionQualified: false as const,
      readOnce: readOnce.bind(undefined),
    }),
  )
}

export function createLivingFrameAuraFaceControlledFixtureModelBindingPort(
  bindOnce: () => Promise<
    LivingFrameAuraFaceCpuModelBindingPacket
  >,
): LivingFrameAuraFaceCpuModelBindingPort {
  assertFunction(bindOnce)
  return registerLivingFrameAuraFaceCpuModelBindingPort(
    Object.freeze({
      portClass:
        'controlled_fixture_auraface_model_binding_port_v1' as const,
      callerLocatorAccepted: false as const,
      callerPathAccepted: false as const,
      callerBytesAccepted: false as const,
      callerUrlAccepted: false as const,
      productionQualified: false as const,
      bindOnce: bindOnce.bind(undefined),
    }),
  )
}

export function createLivingFrameAuraFacePrivateModelBindingPort(
  bindOnce: () => Promise<
    LivingFrameAuraFaceCpuModelBindingPacket
  >,
): LivingFrameAuraFaceCpuModelBindingPort {
  assertFunction(bindOnce)
  return registerLivingFrameAuraFaceCpuModelBindingPort(
    Object.freeze({
      portClass:
        'private_canonical_model_mount_binding_port_v1' as const,
      callerLocatorAccepted: false as const,
      callerPathAccepted: false as const,
      callerBytesAccepted: false as const,
      callerUrlAccepted: false as const,
      productionQualified: false as const,
      bindOnce: bindOnce.bind(undefined),
    }),
  )
}

export function createLivingFrameAuraFaceControlledFixtureSafetyAdmissionPort(
  readOnce: () => Promise<
    LivingFrameAuraFaceCpuSafetyAdmissionPacket
  >,
): LivingFrameAuraFaceCpuSafetyAdmissionPort {
  assertFunction(readOnce)
  return registerLivingFrameAuraFaceCpuSafetyAdmissionPort(
    Object.freeze({
      portClass:
        'controlled_fixture_auraface_safety_admission_port_v1' as const,
      callerAdmissionAccepted: false as const,
      callerConsentBooleanAccepted: false as const,
      callerIdentityAccepted: false as const,
      browserShareable: false as const,
      productionQualified: false as const,
      readOnce: readOnce.bind(undefined),
    }),
  )
}

export function createLivingFrameAuraFacePrivateSafetyAdmissionPort(
  readOnce: () => Promise<
    LivingFrameAuraFaceCpuSafetyAdmissionPacket
  >,
): LivingFrameAuraFaceCpuSafetyAdmissionPort {
  assertFunction(readOnce)
  return registerLivingFrameAuraFaceCpuSafetyAdmissionPort(
    Object.freeze({
      portClass:
        'private_server_owned_auraface_safety_admission_port_v1' as const,
      callerAdmissionAccepted: false as const,
      callerConsentBooleanAccepted: false as const,
      callerIdentityAccepted: false as const,
      browserShareable: false as const,
      productionQualified: false as const,
      readOnce: readOnce.bind(undefined),
    }),
  )
}

export function createLivingFrameAuraFaceControlledFixtureHostPort(
  executeOne: (
    input: LivingFrameAuraFaceCpuHostExecutionInput,
  ) => Promise<LivingFrameAuraFaceCpuHostExecutionResult>,
): LivingFrameAuraFaceCpuHostPort {
  assertFunction(executeOne)
  return registerLivingFrameAuraFaceCpuHostPort(
    Object.freeze({
      portClass:
        'controlled_fixture_auraface_cpu_host_port_v1' as const,
      callerEndpointAccepted: false as const,
      callerPathUrlCredentialAccepted: false as const,
      externalNetworkAllowed: false as const,
      runtimeDownloadsAllowed: false as const,
      productionQualified: false as const,
      executeOne: executeOne.bind(undefined),
    }),
  )
}

export function createLivingFrameAuraFacePrivateOfflineHostPort(
  executeOne: (
    input: LivingFrameAuraFaceCpuHostExecutionInput,
  ) => Promise<LivingFrameAuraFaceCpuHostExecutionResult>,
): LivingFrameAuraFaceCpuHostPort {
  assertFunction(executeOne)
  return registerLivingFrameAuraFaceCpuHostPort(
    Object.freeze({
      portClass:
        'private_offline_auraface_cpu_host_port_v1' as const,
      callerEndpointAccepted: false as const,
      callerPathUrlCredentialAccepted: false as const,
      externalNetworkAllowed: false as const,
      runtimeDownloadsAllowed: false as const,
      productionQualified: false as const,
      executeOne: executeOne.bind(undefined),
    }),
  )
}

function assertFunction(value: unknown): void {
  if (typeof value !== 'function') {
    throw new TypeError(
      'Living Frame AuraFace private port requires a process-bound function.',
    )
  }
}
