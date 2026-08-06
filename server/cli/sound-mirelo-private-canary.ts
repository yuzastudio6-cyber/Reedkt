import { createHash } from 'node:crypto'
import {
  createFailClosedLiveMireloAdapter,
  InMemoryMireloAttemptStore,
} from '../sound/mirelo-sfx-provider'
import {
  PrivateMireloCarrierAudioExtractor,
  PrivateMireloOutputIngestor,
} from '../sound/mirelo-private-artifacts'
import { soundSkillCapabilityManifest } from '../sound/sound-manifest'
import { admitSoundControllerRoute } from '../sound/sound-tool-views'
import { getSoundToolRouteManifest } from '../sound/sound-tool-route-manifest'
import { SOUND_MIRELO_RATE_CARD_SNAPSHOT } from '../sound/sound-rate-card'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for the private Mirelo canary.`)
  return value
}

function gate(name: string): void {
  if (process.env[name] !== '1') throw new Error(`${name}=1 is required; canary remains fail-closed.`)
}

function requiredPositiveInteger(name: string): number {
  const value = Number(required(name))
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive safe integer for the exact canary timeline rate.`)
  }
  return value
}

async function main() {
  gate('SOUND_MIRELO_CANARY_APPROVED')
  gate('SOUND_MIRELO_PRIVACY_APPROVED')
  gate('SOUND_MIRELO_COMMERCIAL_TERMS_APPROVED')
  gate('SOUND_MIRELO_RETENTION_APPROVED')
  gate('SOUND_MIRELO_COST_APPROVED')
  required('MIRELO_API_KEY')
  const privateRoot = required('SOUND_MIRELO_PRIVATE_OUTPUT_ROOT')
  const snapshotId = required('SOUND_MIRELO_APPROVED_SNAPSHOT_ID')
  const snapshotHash = required('SOUND_MIRELO_APPROVED_SNAPSHOT_HASH')
  const reservationId = required('SOUND_MIRELO_CREDIT_RESERVATION_ID')
  const outputScopeId = required('SOUND_MIRELO_PRIVATE_OUTPUT_SCOPE_ID')
  const timelineRate = {
    numerator: requiredPositiveInteger('SOUND_MIRELO_TIMELINE_RATE_NUMERATOR'),
    denominator: requiredPositiveInteger('SOUND_MIRELO_TIMELINE_RATE_DENOMINATOR'),
  }
  const attemptId = `private-canary-${Date.now()}`
  const route = getSoundToolRouteManifest('sound.route.generate.text_sfx.v1')!
  const routeAdmission = admitSoundControllerRoute({
    routeKey: route.routeKey,
    capabilityKey: 'sound.generate_text_conditioned_sfx',
    jobType: 'generate_text_conditioned_sfx',
    mode: 'planning',
    scope: 'range',
    availableInputKeys: [...route.requiredInputs],
    availableQaKeys: [],
    runtimeStatuses: [],
    budgetApproved: true,
    rateCardSnapshotIds: { mirelo_sfx: SOUND_MIRELO_RATE_CARD_SNAPSHOT.rateCardSnapshotId },
    licenseEvidenceRefs: {
      mirelo_sfx: 'sound.license_evidence.private_canary_terms_gate.v1',
      ffmpeg: 'sound.license_evidence.private_canary_ffmpeg_build_gate.v1',
    },
  })
  if (!routeAdmission.admitted || !routeAdmission.binding) {
    throw new Error(`Canonical Mirelo canary route admission failed: ${routeAdmission.reasons.join(',')}`)
  }
  const binding = {
    soundSkillVersion: soundSkillCapabilityManifest.skillVersion,
    soundManifestHash: soundSkillCapabilityManifest.manifestHash,
    capabilityKey: 'sound.generate_text_conditioned_sfx',
    approvedPlanSnapshotId: snapshotId,
    approvedPlanSnapshotHash: snapshotHash,
    approvedWorkItemId: `work-${attemptId}`,
    privateOutputScopeId: outputScopeId,
    idempotencyKey: `local-${attemptId}`,
    operationSpecHash: createHash('sha256').update(`carrier:${attemptId}`).digest('hex'),
    timelineRate,
    creditReservationId: reservationId,
    routeBinding: routeAdmission.binding,
  }
  const adapter = createFailClosedLiveMireloAdapter({
    attempts: new InMemoryMireloAttemptStore(),
    ingestor: new PrivateMireloOutputIngestor(privateRoot, outputScopeId),
    carrierExtractor: new PrivateMireloCarrierAudioExtractor(privateRoot, binding),
  })
  const result = await adapter.generate({
    operation: 'text_to_sfx',
    requestId: `request-${attemptId}`,
    attemptId,
    idempotencyKey: `provider-${attemptId}`,
    approvedPlanSnapshotId: snapshotId,
    approvedPlanSnapshotHash: snapshotHash,
    creditReservationId: reservationId,
    privateOutputScopeId: outputScopeId,
    durationMs: 1_000,
    candidateCount: 1,
    maximumPreflightCredits: 20,
    timeoutMs: 60_000,
    privacyApproved: true,
    commercialTermsApproved: true,
    retentionApproved: true,
    routeBinding: routeAdmission.binding,
    prompt: 'A single restrained soft cloth movement, clean isolated sound effect, no voice, no music',
    loop: false,
  })
  process.stdout.write(`${JSON.stringify({
    status: result.attempt.status,
    attemptId: result.attempt.attemptId,
    providerProfile: 'mirelo.sfx.1.6.v1',
    outputArtifactIds: result.outputArtifacts.map((artifact) => artifact.artifactId),
    outputChecksums: result.outputArtifacts.map((artifact) => artifact.checksumSha256),
    providerUrlsPersisted: result.durableProviderUrlsPersisted,
    preflightCost: result.attempt.providerCostEvidence,
  }, null, 2)}\n`)
}

main().catch((error) => {
  process.stderr.write(`Private Mirelo canary failed closed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
