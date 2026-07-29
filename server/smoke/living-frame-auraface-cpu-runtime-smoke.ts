import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  createLivingFrameControlledIllustrationSourceObservation,
} from '../../src/lib/living-frame/living-frame-controlled-illustration-source-observation-contract'
import {
  createLivingFrameControlledIllustrationSourceObservationFixtureDraft,
} from '../../src/lib/living-frame/living-frame-controlled-illustration-source-observation-fixtures'
import {
  LIVING_FRAME_AURAFACE_CPU_RUNTIME_OPEN_GATES,
} from '../../src/types/living-frame-auraface-cpu-runtime'
import type {
  LivingFrameAuraFaceArtifactRequirements,
} from '../../src/types/living-frame-auraface-artifact-requirements'
import {
  CANONICAL_PRIVATE_TOOL_DISPATCH_RESPONSE_VERSION,
  canonicalPrivateToolDispatchConsumptionResponseSchema,
} from '../validation/canonical-private-tool-dispatch-schemas'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  createLivingFrameAuraFaceArtifactRequirements,
} from '../living-frame/living-frame-auraface-artifact-requirements'
import {
  createLivingFrameAuraFaceContinuityMeasurementFromCpuRuntime,
} from '../living-frame/living-frame-auraface-cpu-measurement-bridge'
import {
  createLivingFrameAuraFaceControlledFixtureAtomicMountHostSessionPort,
  createLivingFrameAuraFaceControlledFixtureHostPort,
  createLivingFrameAuraFaceControlledFixtureInputPort,
  createLivingFrameAuraFaceControlledFixtureModelBindingPort,
  createLivingFrameAuraFaceControlledFixtureSafetyAdmissionPort,
  createLivingFrameAuraFacePrivateInputPort,
  createLivingFrameAuraFacePrivateModelBindingPort,
  createLivingFrameAuraFacePrivateOfflineHostPort,
  createLivingFrameAuraFacePrivateSafetyAdmissionPort,
} from '../living-frame/living-frame-auraface-cpu-host-port'
import {
  consumeLivingFrameAuraFaceCpuEmbeddingOutputLease,
  executeLivingFrameAuraFaceCpuRuntime,
  LivingFrameAuraFaceCpuRuntimeError,
  verifyLivingFrameAuraFaceCpuRuntimeReceipt,
  type LivingFrameAuraFaceCpuHostExecutionResult,
  type LivingFrameAuraFaceCpuHostPort,
  type LivingFrameAuraFaceCpuModelBindingPacket,
  type LivingFrameAuraFaceCpuPrivateInputPacket,
  type LivingFrameAuraFaceCpuPrivateInputPort,
  type LivingFrameAuraFaceCpuSafetyAdmissionPacket,
} from '../living-frame/living-frame-auraface-cpu-runtime'

const DIGESTS = {
  referenceArtifact: '1'.repeat(64),
  candidateArtifact: '2'.repeat(64),
  referenceContinuity: '3'.repeat(64),
  candidateContinuity: '4'.repeat(64),
  preprocessing: '5'.repeat(64),
  consentSafety: '6'.repeat(64),
  referenceInference: '7'.repeat(64),
  candidateInference: '8'.repeat(64),
} as const

async function main(): Promise<void> {
  const requirements = await artifactRequirements()
  const sourceBindings = bindings(requirements)
  const dispatch = canonicalDispatchConsumption()
  const ports = fixturePorts(requirements)
  const result = await executeLivingFrameAuraFaceCpuRuntime({
    artifactRequirements: requirements,
    sourceBindings,
    canonicalDispatchConsumption: dispatch,
    ...ports,
  })

  assert.equal(
    verifyLivingFrameAuraFaceCpuRuntimeReceipt(result.receipt),
    true,
  )
  assert.equal(result.receipt.hostObservation.terminalState, 'completed')
  assert.equal(result.receipt.hostObservation.faceOutcome,
    'exactly_one_face_each')
  assert.equal(
    result.receipt.evidenceClass,
    'controlled_non_promotable_auraface_cpu_runtime_fixture',
  )
  assert.equal(result.receipt.output?.embeddingDimension, 512)
  assert.equal(result.receipt.output?.embeddingsIncluded, false)
  assert.equal(result.receipt.output?.identityOrLikenessApproved, false)
  assert.equal(result.receipt.outputLeaseIssued, true)
  assert.equal(result.receipt.actualCostEvidenceCreated, false)
  assert.equal(result.receipt.operation.separateCpuContinuityAttempt, true)
  assert.equal(
    result.receipt.operation.excludedFromSharedComfyuiGpuAttempt,
    true,
  )
  assert.equal(result.receipt.operation.exactReuseAddsNoAttempt, true)
  assert.deepEqual(
    result.receipt.openGateCodes,
    LIVING_FRAME_AURAFACE_CPU_RUNTIME_OPEN_GATES,
  )
  assertAllPromotionAuthoritiesFalse(result.receipt)

  const atomicPorts = fixtureAtomicPorts(requirements)
  const atomicResult =
    await executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings,
      canonicalDispatchConsumption:
        canonicalDispatchConsumption(),
      ...atomicPorts,
    })
  assert.equal(
    verifyLivingFrameAuraFaceCpuRuntimeReceipt(
      atomicResult.receipt,
    ),
    true,
  )
  assert.equal(
    atomicResult.receipt.hostObservation.terminalState,
    'completed',
  )
  assert.equal(
    atomicResult.receipt.modelBindings.every(
      (binding) =>
        binding.objectVerifiedBeforeConsumer
        && binding.objectVerifiedAfterConsumer,
    ),
    true,
  )
  assert.equal(
    JSON.stringify(atomicResult.receipt).includes(
      'canonicalMountSessionDigestSha256',
    ),
    false,
  )
  assert(result.embeddingOutputLease)
  const packet =
    consumeLivingFrameAuraFaceCpuEmbeddingOutputLease(
      result.embeddingOutputLease,
    )
  assert.equal(packet.referenceEmbedding.length, 512)
  assert.equal(packet.candidateEmbedding.length, 512)
  assert.equal(packet.referenceEmbedding[0], 1)
  assert.equal(packet.candidateEmbedding[0], 1)
  assert.equal(packet.embeddingPersistenceAuthorized, false)
  assert.equal(packet.identityApprovalAuthority, false)
  expectSyncIssue(
    () => consumeLivingFrameAuraFaceCpuEmbeddingOutputLease(
      result.embeddingOutputLease!,
    ),
    'output_lease_reused',
  )

  const bridgeRuntime =
    await executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings,
      canonicalDispatchConsumption:
        canonicalDispatchConsumption(),
      ...fixturePorts(requirements),
    })
  assert(bridgeRuntime.embeddingOutputLease)
  const bridgedMeasurement =
    await createLivingFrameAuraFaceContinuityMeasurementFromCpuRuntime({
      artifactRequirements: requirements,
      embeddingOutputLease:
        bridgeRuntime.embeddingOutputLease,
    })
  assert.equal(bridgedMeasurement.measurement.scorePpm, 1_000_000)
  assert.equal(
    bridgedMeasurement.evidenceClass,
    'controlled_non_promotable_embedding_fixture',
  )
  assert.equal(
    bridgedMeasurement.controlledFixtureVectorsCompared,
    true,
  )
  assert.equal(
    bridgedMeasurement.privateRuntimeVectorsComparedUnreleased,
    false,
  )
  assert.equal(
    bridgedMeasurement.measurement.identityOrLikenessApproved,
    false,
  )

  const serialized = JSON.stringify(result.receipt)
  for (const forbidden of [
    '"referenceEmbedding"',
    '"candidateEmbedding"',
    '"contentBytes"',
    'https://',
    'http://',
    'file://',
    '/tmp/',
    '"customerCredits"',
    '"serviceFee"',
    'musashi',
    'helicopter',
    'hormuz',
    'pulid',
  ]) assert.equal(serialized.toLowerCase().includes(
    forbidden.toLowerCase(),
  ), false)

  let adversarialAssertions = 0

  const reusableAtomicSession =
    fixtureAtomicPorts(requirements).canonicalMountHostSessionPort
  await executeLivingFrameAuraFaceCpuRuntime({
    artifactRequirements: requirements,
    sourceBindings,
    canonicalDispatchConsumption: canonicalDispatchConsumption(),
    ...fixtureAtomicPorts(requirements),
    canonicalMountHostSessionPort: reusableAtomicSession,
  })
  await expectIssue(
    () => executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings,
      canonicalDispatchConsumption:
        canonicalDispatchConsumption(),
      ...fixtureAtomicPorts(requirements),
      canonicalMountHostSessionPort: reusableAtomicSession,
    }),
    'canonical_mount_host_session_port_reused',
  )
  adversarialAssertions += 1

  await expectIssue(
    () => executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings,
      canonicalDispatchConsumption:
        canonicalDispatchConsumption(),
      ...fixturePorts(requirements),
      canonicalMountHostSessionPort:
        fixtureAtomicPorts(requirements)
          .canonicalMountHostSessionPort,
    }),
    'canonical_mount_host_session_port_invalid',
  )
  adversarialAssertions += 1

  await expectIssue(
    () => executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings,
      canonicalDispatchConsumption:
        canonicalDispatchConsumption(),
      inputPort:
        createLivingFrameAuraFacePrivateInputPort(
          async () => inputPacket(requirements),
        ),
      modelBindingPort:
        createLivingFrameAuraFacePrivateModelBindingPort(
          async () => modelPacket(requirements),
        ),
      safetyAdmissionPort:
        createLivingFrameAuraFacePrivateSafetyAdmissionPort(
          async () => safetyPacket(),
        ),
      hostPort:
        createLivingFrameAuraFacePrivateOfflineHostPort(
          async () => ({
            ...completedHostResult(),
            evidenceClass:
              'private_internal_auraface_cpu_runtime_observation_unreleased',
            detectorInferenceExecuted: true,
            embeddingInferenceExecuted: true,
          }),
        ),
    }),
    'canonical_mount_host_session_port_invalid',
  )
  adversarialAssertions += 1

  const reusablePorts = fixturePorts(requirements)
  await executeLivingFrameAuraFaceCpuRuntime({
    artifactRequirements: requirements,
    sourceBindings,
    canonicalDispatchConsumption: canonicalDispatchConsumption(),
    ...reusablePorts,
  })
  await expectIssue(
    () => executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings,
      canonicalDispatchConsumption: canonicalDispatchConsumption(),
      ...reusablePorts,
    }),
    'input_port_reused',
  )
  adversarialAssertions += 1

  const spreadInput = {
    ...fixturePorts(requirements).inputPort,
  } as LivingFrameAuraFaceCpuPrivateInputPort
  await expectIssue(
    () => executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings,
      canonicalDispatchConsumption: canonicalDispatchConsumption(),
      ...fixturePorts(requirements),
      inputPort: spreadInput,
    }),
    'input_port_invalid',
  )
  adversarialAssertions += 1

  const forgedSafetyPorts = fixturePorts(requirements, {
    safetyPacket: {
      ...safetyPacket(),
      identityApprovalGranted: true,
    } as never,
  })
  await expectIssue(
    () => executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings,
      canonicalDispatchConsumption: canonicalDispatchConsumption(),
      ...forgedSafetyPorts,
    }),
    'source_binding_invalid',
  )
  adversarialAssertions += 1

  await expectIssue(
    () => executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: {
        ...requirements,
        requirementSetDigestSha256: 'a'.repeat(64),
      },
      sourceBindings,
      canonicalDispatchConsumption: canonicalDispatchConsumption(),
      ...fixturePorts(requirements),
    }),
    'artifact_requirements_invalid',
  )
  adversarialAssertions += 1

  await expectIssue(
    () => executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings: {
        ...sourceBindings,
        artifactRequirementSetDigestSha256: 'a'.repeat(64),
      },
      canonicalDispatchConsumption: canonicalDispatchConsumption(),
      ...fixturePorts(requirements),
    }),
    'source_binding_invalid',
  )
  adversarialAssertions += 1

  await expectIssue(
    () => executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings,
      canonicalDispatchConsumption: {
        ...canonicalDispatchConsumption(),
        responseHash: 'a'.repeat(64),
      },
      ...fixturePorts(requirements),
    }),
    'canonical_dispatch_invalid',
  )
  adversarialAssertions += 1

  const replayed = canonicalDispatchConsumption(true)
  await expectIssue(
    () => executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings,
      canonicalDispatchConsumption: replayed,
      ...fixturePorts(requirements),
    }),
    'canonical_dispatch_replay_forbidden',
  )
  adversarialAssertions += 1

  await expectIssue(
    () => executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings,
      canonicalDispatchConsumption:
        canonicalDispatchConsumption(false, {
          operationId:
            'tool.transformers.inspect_offline_model_config.v1',
        }),
      ...fixturePorts(requirements),
    }),
    'canonical_operation_mismatch',
  )
  adversarialAssertions += 1

  const badInputPorts = fixturePorts(requirements, {
    inputPacket: {
      ...inputPacket(requirements),
      items: [
        {
          ...inputPacket(requirements).items[0],
          contentSha256: 'a'.repeat(64),
        },
        inputPacket(requirements).items[1],
      ],
    },
  })
  await expectIssue(
    () => executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings,
      canonicalDispatchConsumption: canonicalDispatchConsumption(),
      ...badInputPorts,
    }),
    'input_packet_invalid',
  )
  adversarialAssertions += 1

  const wrongLineagePorts = fixturePorts(requirements, {
    inputPacket: {
      ...inputPacket(requirements),
      items: [
        {
          ...inputPacket(requirements).items[0],
          artifactDigestSha256: 'a'.repeat(64),
        },
        inputPacket(requirements).items[1],
      ],
    },
  })
  await expectIssue(
    () => executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings,
      canonicalDispatchConsumption: canonicalDispatchConsumption(),
      ...wrongLineagePorts,
    }),
    'input_packet_lineage_invalid',
  )
  adversarialAssertions += 1

  const wrongModelPorts = fixturePorts(requirements, {
    modelPacket: {
      ...modelPacket(requirements),
      bindings: [
        {
          ...modelPacket(requirements).bindings[0],
          contentSha256:
            requirements.artifacts[1].contentSha256,
        },
        modelPacket(requirements).bindings[1],
      ],
    },
  })
  await expectIssue(
    () => executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings,
      canonicalDispatchConsumption: canonicalDispatchConsumption(),
      ...wrongModelPorts,
    }),
    'model_binding_invalid',
  )
  adversarialAssertions += 1

  const privateEvidenceFromFixture = fixturePorts(requirements, {
    hostResult: {
      ...completedHostResult(),
      evidenceClass:
        'private_internal_auraface_cpu_runtime_observation_unreleased',
    },
  })
  await expectIssue(
    () => executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings,
      canonicalDispatchConsumption: canonicalDispatchConsumption(),
      ...privateEvidenceFromFixture,
    }),
    'host_execution_result_invalid',
  )
  adversarialAssertions += 1

  const invalidEmbedding = basis(0, 1)
  invalidEmbedding[4] = Number.NaN
  const invalidEmbeddingPorts = fixturePorts(requirements, {
    hostResult: {
      ...completedHostResult(),
      candidateEmbedding: invalidEmbedding,
    },
  })
  await expectIssue(
    () => executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings,
      canonicalDispatchConsumption: canonicalDispatchConsumption(),
      ...invalidEmbeddingPorts,
    }),
    'embedding_output_invalid',
  )
  adversarialAssertions += 1

  const reviewPorts = fixturePorts(requirements, {
    hostResult: {
      evidenceClass:
        'controlled_non_promotable_auraface_cpu_runtime_fixture',
      terminalState: 'user_review_required',
      failureCode: 'face_review_required',
      faceOutcome: 'candidate_multiple_faces',
      attemptAccepted: true,
      detectorInferenceExecuted: false,
      embeddingInferenceExecuted: false,
      startedAt: '2026-07-29T12:00:00.000Z',
      finishedAt: '2026-07-29T12:00:00.025Z',
      externalNetworkPerformed: false,
      runtimeDownloadPerformed: false,
    },
  })
  const review = await executeLivingFrameAuraFaceCpuRuntime({
    artifactRequirements: requirements,
    sourceBindings,
    canonicalDispatchConsumption: canonicalDispatchConsumption(),
    ...reviewPorts,
  })
  assert.equal(review.receipt.output, undefined)
  assert.equal(review.receipt.outputLeaseIssued, false)
  assert.equal(review.embeddingOutputLease, undefined)
  assert.equal(
    review.receipt.hostObservation.terminalState,
    'user_review_required',
  )
  adversarialAssertions += 1

  const failedWithEmbedding = fixturePorts(requirements, {
    hostResult: {
      ...completedHostResult(),
      terminalState: 'failed',
      failureCode: 'host_execution_failed',
      faceOutcome: 'not_observed',
    },
  })
  await expectIssue(
    () => executeLivingFrameAuraFaceCpuRuntime({
      artifactRequirements: requirements,
      sourceBindings,
      canonicalDispatchConsumption: canonicalDispatchConsumption(),
      ...failedWithEmbedding,
    }),
    'host_execution_result_invalid',
  )
  adversarialAssertions += 1

  assert.equal(
    verifyLivingFrameAuraFaceCpuRuntimeReceipt({
      ...result.receipt,
      runtimeObservationDigestSha256: 'a'.repeat(64),
    }),
    false,
  )
  adversarialAssertions += 1
  assert.equal(
    verifyLivingFrameAuraFaceCpuRuntimeReceipt({
      ...result.receipt,
      authorityBoundary: {
        ...result.receipt.authorityBoundary,
        identityVerificationAuthority: true,
        productionAuthority: true,
      },
    }),
    false,
  )
  adversarialAssertions += 1
  assert.equal(
    verifyLivingFrameAuraFaceCpuRuntimeReceipt({
      ...result.receipt,
      output: {
        ...result.receipt.output!,
        embeddingsIncluded: true,
        identityOrLikenessApproved: true,
      },
    }),
    false,
  )
  adversarialAssertions += 1
  assert.equal(
    verifyLivingFrameAuraFaceCpuRuntimeReceipt({
      ...result.receipt,
      endpoint: 'https://example.invalid/auraface',
    }),
    false,
  )
  adversarialAssertions += 1

  assert.equal(adversarialAssertions, 22)
  console.log(
    'Living Frame AuraFace CPU runtime smoke passed: '
      + '1 separately metered controlled CPU attempt, '
      + '1 user-review outcome, and '
      + `${adversarialAssertions} adversarial assertions.`,
  )
}

function fixtureAtomicPorts(
  requirements: LivingFrameAuraFaceArtifactRequirements,
) {
  const packet = inputPacket(requirements)
  return {
    inputPort:
      createLivingFrameAuraFaceControlledFixtureInputPort(
        async () => packet,
      ),
    safetyAdmissionPort:
      createLivingFrameAuraFaceControlledFixtureSafetyAdmissionPort(
        async () => safetyPacket(),
      ),
    canonicalMountHostSessionPort:
      createLivingFrameAuraFaceControlledFixtureAtomicMountHostSessionPort(
        async (input) => {
          assert.equal(
            input.artifactRequirementSetDigestSha256,
            requirements.requirementSetDigestSha256,
          )
          assert.equal(
            input.referenceImage.contentSha256,
            packet.items[0].contentSha256,
          )
          assert.equal(
            input.candidateImage.contentSha256,
            packet.items[1].contentSha256,
          )
          assert.equal(input.callerThresholdAccepted, false)
          assert.equal(input.identityApprovalRequested, false)
          assert.equal(input.externalNetworkAllowed, false)
          assert.equal(input.runtimeDownloadsAllowed, false)
          return {
            modelBindingPacket: modelPacket(requirements),
            hostExecutionResult: completedHostResult(),
            canonicalMountSessionDigestSha256:
              digest('atomic-mount-session'),
            runnerRequestEnvelopeSha256:
              digest('atomic-runner-request'),
            atomicMountAndInferenceCompleted: true,
            callerPathUrlCredentialCommandAccepted: false,
            externalNetworkPerformed: false,
            runtimeDownloadPerformed: false,
            productionQualified: false,
          }
        },
      ),
  }
}

async function artifactRequirements() {
  const { qualification, draft } =
    await createLivingFrameControlledIllustrationSourceObservationFixtureDraft()
  const sourceObservation =
    await createLivingFrameControlledIllustrationSourceObservation({
      qualification,
      draft,
    })
  return createLivingFrameAuraFaceArtifactRequirements({
    qualification,
    sourceObservation,
  })
}

function bindings(
  requirements: LivingFrameAuraFaceArtifactRequirements,
) {
  return {
    artifactRequirementSetDigestSha256:
      requirements.requirementSetDigestSha256,
    referenceArtifactId: 'asset.lf.auraface.reference',
    referenceArtifactDigestSha256: DIGESTS.referenceArtifact,
    referenceContinuityEntryDigestSha256:
      DIGESTS.referenceContinuity,
    candidateArtifactId: 'asset.lf.auraface.candidate',
    candidateArtifactDigestSha256: DIGESTS.candidateArtifact,
    candidateContinuityEntryDigestSha256:
      DIGESTS.candidateContinuity,
    preprocessingSpecDigestSha256: DIGESTS.preprocessing,
    consentAndSafetyAdmissionDigestSha256:
      DIGESTS.consentSafety,
  } as const
}

function fixturePorts(
  requirements: LivingFrameAuraFaceArtifactRequirements,
  overrides?: {
    readonly inputPacket?:
      LivingFrameAuraFaceCpuPrivateInputPacket
    readonly modelPacket?:
      LivingFrameAuraFaceCpuModelBindingPacket
    readonly safetyPacket?:
      LivingFrameAuraFaceCpuSafetyAdmissionPacket
    readonly hostResult?:
      LivingFrameAuraFaceCpuHostExecutionResult
  },
): {
  readonly inputPort: LivingFrameAuraFaceCpuPrivateInputPort
  readonly modelBindingPort: ReturnType<
    typeof createLivingFrameAuraFaceControlledFixtureModelBindingPort
  >
  readonly safetyAdmissionPort: ReturnType<
    typeof createLivingFrameAuraFaceControlledFixtureSafetyAdmissionPort
  >
  readonly hostPort: LivingFrameAuraFaceCpuHostPort
} {
  const packet = overrides?.inputPacket ?? inputPacket(requirements)
  const models = overrides?.modelPacket ?? modelPacket(requirements)
  const safety = overrides?.safetyPacket ?? safetyPacket()
  const hostResult = overrides?.hostResult ?? completedHostResult()
  return {
    inputPort:
      createLivingFrameAuraFaceControlledFixtureInputPort(
        async () => packet,
      ),
    modelBindingPort:
      createLivingFrameAuraFaceControlledFixtureModelBindingPort(
        async () => models,
      ),
    safetyAdmissionPort:
      createLivingFrameAuraFaceControlledFixtureSafetyAdmissionPort(
        async () => safety,
      ),
    hostPort:
      createLivingFrameAuraFaceControlledFixtureHostPort(
        async (input) => {
          assert.equal(
            input.artifactRequirementSetDigestSha256,
            requirements.requirementSetDigestSha256,
          )
          assert.equal(
            input.referenceImage.contentSha256,
            inputPacket(requirements).items[0].contentSha256,
          )
          assert.equal(
            input.candidateImage.contentSha256,
            inputPacket(requirements).items[1].contentSha256,
          )
          assert.match(
            input.modelBindingPacketDigestSha256,
            /^[a-f0-9]{64}$/u,
          )
          assert.equal(input.callerThresholdAccepted, false)
          assert.equal(input.identityApprovalRequested, false)
          assert.equal(input.externalNetworkAllowed, false)
          assert.equal(input.runtimeDownloadsAllowed, false)
          return hostResult
        },
      ),
  }
}

function safetyPacket():
  LivingFrameAuraFaceCpuSafetyAdmissionPacket {
  return {
    packetClass:
      'process_bound_auraface_safety_admission_packet_v1',
    consentAndSafetyAdmissionDigestSha256:
      DIGESTS.consentSafety,
    canonicalScope: {
      workspaceId: 'workspace.lf.fixture',
      projectId: 'project.lf.fixture',
      editSessionId: 'edit.lf.fixture',
    },
    admissionOutcome:
      'admitted_for_private_continuity_measurement',
    realPersonConsentPolicyPassed: true,
    minorProtectionPolicyPassed: true,
    impersonationAndDeepfakePolicyPassed: true,
    documentarySafetyPolicyPassed: true,
    retentionAndDeletionPolicyPassed: true,
    identityApprovalGranted: false,
    subjectIdentityIncluded: false,
    rawPolicyEvidenceIncluded: false,
    productionReady: false,
  }
}

function inputPacket(
  requirements: LivingFrameAuraFaceArtifactRequirements,
): LivingFrameAuraFaceCpuPrivateInputPacket {
  const referenceBytes = fixturePng(0x11)
  const candidateBytes = fixtureJpeg(0x22)
  return {
    packetClass:
      'process_bound_server_owned_auraface_input_packet_v1',
    artifactRequirementSetDigestSha256:
      requirements.requirementSetDigestSha256,
    preprocessingSpecDigestSha256: DIGESTS.preprocessing,
    consentAndSafetyAdmissionDigestSha256:
      DIGESTS.consentSafety,
    items: [
      {
        role: 'reference',
        artifactId: 'asset.lf.auraface.reference',
        artifactDigestSha256: DIGESTS.referenceArtifact,
        continuityEntryDigestSha256:
          DIGESTS.referenceContinuity,
        contentType: 'image/png',
        contentByteLength: referenceBytes.length,
        contentSha256: digestBytes(referenceBytes),
        contentBytes: referenceBytes,
      },
      {
        role: 'candidate',
        artifactId: 'asset.lf.auraface.candidate',
        artifactDigestSha256: DIGESTS.candidateArtifact,
        continuityEntryDigestSha256:
          DIGESTS.candidateContinuity,
        contentType: 'image/jpeg',
        contentByteLength: candidateBytes.length,
        contentSha256: digestBytes(candidateBytes),
        contentBytes: candidateBytes,
      },
    ],
    callerBytesPathUrlOrCredentialAccepted: false,
    browserShareable: false,
    productionReady: false,
  }
}

function modelPacket(
  requirements: LivingFrameAuraFaceArtifactRequirements,
): LivingFrameAuraFaceCpuModelBindingPacket {
  const bindings = requirements.artifacts.map((artifact) => ({
    canonicalOrder: artifact.canonicalOrder,
    requirementId: artifact.requirementId,
    artifactIdentityCode: artifact.artifactIdentityCode,
    sourceRevision: artifact.sourceRevision,
    artifactFormat: artifact.artifactFormat,
    byteLength: artifact.byteLength,
    contentSha256: artifact.contentSha256,
    artifactRecordIdDigestSha256:
      digest(`record-${artifact.canonicalOrder}`),
    descriptorDigestSha256:
      digest(`descriptor-${artifact.canonicalOrder}`),
    mountConsumptionDigestSha256:
      digest(`mount-${artifact.canonicalOrder}`),
    consumerScope: artifact.consumerScope,
    executionTarget: artifact.requiredExecutionTarget,
    objectVerifiedBeforeConsumer: true as const,
    objectVerifiedAfterConsumer: true as const,
    readOnlySourcePresented: true as const,
    hostPathIncluded: false as const,
    mountAliasIncluded: false as const,
  }))
  return {
    packetClass:
      'process_bound_auraface_model_artifact_mount_binding_packet_v1',
    artifactRequirementSetDigestSha256:
      requirements.requirementSetDigestSha256,
    bindings: bindings as unknown as
      LivingFrameAuraFaceCpuModelBindingPacket['bindings'],
    pathsIncluded: false,
    mountAliasesIncluded: false,
    modelBytesIncluded: false,
    runtimeDownloadsPerformed: false,
    productionReady: false,
  }
}

function completedHostResult():
  LivingFrameAuraFaceCpuHostExecutionResult {
  return {
    evidenceClass:
      'controlled_non_promotable_auraface_cpu_runtime_fixture',
    terminalState: 'completed',
    failureCode: 'none',
    faceOutcome: 'exactly_one_face_each',
    attemptAccepted: true,
    detectorInferenceExecuted: false,
    embeddingInferenceExecuted: false,
    startedAt: '2026-07-29T12:00:00.000Z',
    finishedAt: '2026-07-29T12:00:00.050Z',
    referenceInferenceOutputDigestSha256:
      DIGESTS.referenceInference,
    candidateInferenceOutputDigestSha256:
      DIGESTS.candidateInference,
    referenceEmbedding: basis(0, 1),
    candidateEmbedding: basis(0, 1),
    externalNetworkPerformed: false,
    runtimeDownloadPerformed: false,
  }
}

function canonicalDispatchConsumption(
  replayed = false,
  overrides?: {
    readonly operationId?: string
  },
) {
  const timestamp = '2026-07-29T11:59:00.000Z'
  const responseWithoutHash = {
    schemaVersion:
      CANONICAL_PRIVATE_TOOL_DISPATCH_RESPONSE_VERSION,
    source: 'canonical_private_tool_dispatch_authority' as const,
    purpose:
      'private_internal_canonical_tool_dispatch_consume' as const,
    consumed: true as const,
    consumedAt: timestamp,
    executionAttemptId: 'attempt.lf.auraface.fixture.001',
    consumptionReplayed: replayed,
    grant: {
      grantId: 'attempt.lf.auraface.fixture.001',
      status: 'consumed' as const,
      binding: {
        workspaceId: 'workspace.lf.fixture',
        projectId: 'project.lf.fixture',
        editSessionId: 'edit.lf.fixture',
        jobId: 'job.lf.auraface.fixture',
        approvedPlanSnapshotId: 'snapshot.lf.fixture',
        approvedWorkItemId: 'work.lf.auraface.fixture',
        expectedAssetId: 'asset.lf.auraface.candidate',
        requestedToolName: 'Transformers',
        canonicalToolId: 'transformers',
        operationId: overrides?.operationId
          ?? 'tool.transformers.measure_auraface_identity_continuity.v1',
        leaseId: 'lease.lf.auraface.fixture',
        leaseAttemptNumber: 1,
        leaseImmutableHash: digest('lease'),
        leaseDependencyAuthority: {
          state: 'not_required_for_root_job' as const,
          readinessHash: digest('readiness'),
          authorityHash: digest('dependency-authority'),
          selectedArtifactsHash: digest([]),
          selectedArtifactCount: 0,
          liveRuntimeEligible: false as const,
        },
        leaseExecutionFenceState: 'not_started' as const,
        reservationId: 'reservation.lf.fixture',
        maximumCreditBudget: 10,
        remainingReservedCreditsAtDecision: 10,
        expectedOutput: {
          outputKey: 'auraface_continuity_measurement',
          artifactType: 'qa_report',
          assetRole: 'qa' as const,
          required: true,
          previewPlaceholderAllowed: false,
          contentType: 'application/json',
          segmentIds: ['segment.lf.fixture'],
          timingIds: ['timing.lf.fixture'],
          rendererLayerIds: [],
        },
      },
      issuedAt: timestamp,
      expiresAt: '2026-07-29T12:05:00.000Z',
      immutableGrantHash: digest('grant'),
      singleUse: true as const,
      credentialReturned: false as const,
    },
    verificationEvidence: {
      tenantAndCanonicalAuthority: 'passed' as const,
      activeOpaqueLease: 'passed' as const,
      timingSafeDispatchCredentialMatch: 'passed' as const,
      immutableGrantHash: 'passed' as const,
      exactWorkItemOutputToolOperation: 'passed' as const,
      fundedReservationAndBudget: 'passed' as const,
      toolOperationSpecHash: 'passed' as const,
      runtimeEvidenceAuthorityHash: 'passed' as const,
      runtimeEvidenceRecordHash: 'passed' as const,
      privateRuntimeAuthorityHash: 'passed' as const,
      privateRuntimeImageIdentityHash: 'passed' as const,
      privateInternalReadiness: 'passed' as const,
      leaseDependencyAuthorityBinding: 'passed' as const,
      leaseExecutionFenceNotStarted: 'passed' as const,
      atomicSingleUseTransition: 'passed' as const,
      leaseCredentialReturned: false as const,
      dispatchCredentialReturned: false as const,
      credentialHashReturned: false as const,
    },
    executionAuthority: {
      dispatchGrantConsumed: true as const,
      newExecutionStartAuthorized: !replayed,
      resumeSameIdempotentAttemptOnly: replayed,
      toolExecutionAuthorized: !replayed,
      executionAttemptId: 'attempt.lf.auraface.fixture.001',
      outputPromotionRequiresCreateOnlyAttemptId: true as const,
      costEventRequiresSameIdempotentAttemptId: true as const,
      providerCallAuthorized: false as const,
      sourceObjectReadAuthorized: false as const,
      artifactWriteAuthorized: false as const,
      renderAuthorized: false as const,
      privatePreviewRenderAuthorized: false,
      privateCaptionRenderAuthorized: false,
      privateFinalCompositionAuthorized: false,
      privateCompositionChunkAuthorized: false,
      creditSpendAuthorized: false as const,
      walletMutationAuthorized: false as const,
      settlementAuthorized: false as const,
      toolExecutionPerformedByConsume: false as const,
    },
    testOnly: true as const,
  }
  return canonicalPrivateToolDispatchConsumptionResponseSchema.parse({
    ...responseWithoutHash,
    responseHash: sha256AuthorityValue(responseWithoutHash),
  })
}

function basis(index: number, value: number): Float32Array {
  const vector = new Float32Array(512)
  vector[index] = value
  return vector
}

function fixturePng(fill: number): Uint8Array {
  const value = new Uint8Array(64).fill(fill)
  value.set(
    Buffer.from('89504e470d0a1a0a', 'hex'),
    0,
  )
  return value
}

function fixtureJpeg(fill: number): Uint8Array {
  const value = new Uint8Array(64).fill(fill)
  value[0] = 0xff
  value[1] = 0xd8
  value[value.length - 2] = 0xff
  value[value.length - 1] = 0xd9
  return value
}

function digestBytes(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(value), 'utf8')
    .digest('hex')
}

async function expectIssue(
  action: () => Promise<unknown>,
  code: LivingFrameAuraFaceCpuRuntimeError['code'],
): Promise<void> {
  await assert.rejects(
    action,
    (error: unknown) =>
      error instanceof LivingFrameAuraFaceCpuRuntimeError
      && error.code === code,
  )
}

function expectSyncIssue(
  action: () => unknown,
  code: LivingFrameAuraFaceCpuRuntimeError['code'],
): void {
  assert.throws(
    action,
    (error: unknown) =>
      error instanceof LivingFrameAuraFaceCpuRuntimeError
      && error.code === code,
  )
}

function assertAllPromotionAuthoritiesFalse(
  receipt: Awaited<
    ReturnType<typeof executeLivingFrameAuraFaceCpuRuntime>
  >['receipt'],
): void {
  for (const [key, value] of Object.entries(
    receipt.authorityBoundary,
  )) {
    if (
      [
        'processBoundInputObservation',
        'processBoundModelBindingObservation',
        'processBoundSafetyAdmissionObservation',
        'processBoundHostInvocationObservation',
      ].includes(key)
    ) {
      assert.equal(value, true)
    } else {
      assert.equal(value, false, `${key} must remain false`)
    }
  }
  assert.equal(receipt.productionReady, false)
}

void main()
