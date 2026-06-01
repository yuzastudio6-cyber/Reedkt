import { audioStackDemucsDoesNotDo } from './audio-stack-demucs-policy'
import type { AudioStackDemucsCommandPlan } from './audio-stack-demucs-types'

export function buildAudioStackDemucsCommandPlans(): AudioStackDemucsCommandPlan[] {
  return [
    plan('preflight-phase36g', 'preflight', 'gcloud auth list && gcloud config get-value project && gcloud projects describe reeditpro', false, true),
    plan('verify-demucs-official-evidence', 'evidence', 'review official facebookresearch/demucs README, LICENSE, and pretrained-model license issue', false, true),
    plan('blocked-demucs-download', 'download', 'NO_DOWNLOAD: Demucs htdemucs model artifacts are blocked pending pretrained-model license/provenance clarity', false, false, 'Demucs pretrained-model license/provenance is ambiguous.'),
    plan('blocked-demucs-runtime', 'runtime', 'NO_RUNTIME: Demucs generated-audio and controlled-video separation are blocked pending approved model artifacts', false, false, 'No approved Demucs model artifact/checksum/private GCS manifest exists.'),
    plan('phase36g-report', 'report', 'npm run activation:audio-stack-demucs:report', false, true),
    plan('phase36g-validate', 'validate', 'npm run smoke:activation-audio-stack-demucs && npm run prod:readiness:summary && npm run prod:beta:summary', false, true),
  ]
}

function plan(
  commandId: string,
  phase: AudioStackDemucsCommandPlan['phase'],
  commandString: string,
  requiresConfirmation: boolean,
  enabledInPhase36G: boolean,
  blockedReason?: string,
): AudioStackDemucsCommandPlan {
  return {
    commandId,
    phase,
    commandString,
    requiresConfirmation,
    textOnlyByDefault: true,
    enabledInPhase36G,
    blockedReason,
    doesNotDo: [...audioStackDemucsDoesNotDo],
  }
}
