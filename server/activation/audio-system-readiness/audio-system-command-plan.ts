import { audioSystemReadinessDoesNotDo } from './audio-system-readiness-policy'
import type { AudioSystemReadinessCommandPlan } from './audio-system-readiness-types'

export function buildAudioSystemReadinessCommandPlans(): AudioSystemReadinessCommandPlan[] {
  return [
    plan('preflight', 'preflight', 'gcloud auth list && gcloud config get-value project && gcloud projects describe reeditpro'),
    plan('verify-phase36e-artifacts', 'verify-artifacts', 'gcloud storage objects describe <Phase36E artifact refs from private report>'),
    plan('execute-phase36f-readiness', 'execute', 'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_AUDIO_SYSTEM_INTERNAL_BETA_READINESS=true npm run activation:audio-system-readiness -- --execute', true),
    plan('report-phase36f-readiness', 'report', 'npm run activation:audio-system-readiness:report'),
    plan('validate-phase36f-readiness', 'validate', 'npm run smoke:activation-audio-system-readiness && npm run prod:readiness:summary && npm run prod:beta:summary'),
  ]
}

function plan(
  commandId: string,
  phase: AudioSystemReadinessCommandPlan['phase'],
  commandString: string,
  requiresConfirmation = false,
): AudioSystemReadinessCommandPlan {
  return {
    commandId,
    phase,
    commandString,
    requiresConfirmation,
    textOnlyByDefault: true,
    doesNotDo: [...audioSystemReadinessDoesNotDo],
    warnings: [
      'Phase 36F command plans must not enable public access, providers, RNNoise, Demucs, arbitrary media, external beta, paid production, or production.',
    ],
  }
}
