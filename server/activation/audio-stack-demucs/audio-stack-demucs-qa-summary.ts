import { demucsEvidenceBlockers } from './demucs-source-evidence'
import type { AudioStackDemucsQaGate } from './audio-stack-demucs-types'

export const audioStackDemucsQaGateIds = [
  'tool_routing',
  'rnnoise_removal',
  'demucs_source_evidence',
  'demucs_license_provenance',
  'download_runtime_block',
  'controlled_source_scope',
  'privacy_security',
  'blocked_features',
  'phase37a_scope',
] as const

export function buildAudioStackDemucsQaGates(): AudioStackDemucsQaGate[] {
  const blockers = demucsEvidenceBlockers()
  return [
    gate('tool_routing', 'passed', 'DeepFilterNet owns speech cleanup; Demucs owns separation behind approved-model gating; RNNoise is not product-routed.'),
    gate('rnnoise_removal', 'passed', 'RNNoise is removed from active labels, fallback plans, and Phase 36G execution scope.'),
    gate('demucs_source_evidence', 'warning', 'Official Demucs repo/model documentation exists, but official htdemucs auto-download remains blocked; use company-approved artifacts only.'),
    gate('demucs_license_provenance', blockers.length ? 'warning' : 'passed', blockers.length ? blockers.join(' ') + ' Manifest-gated company artifacts can still be approved separately.' : 'Demucs company-controlled model evidence is clear.'),
    gate('download_runtime_block', 'passed', 'Runtime model downloads are disabled; non-mock runtime requires approved local/company-controlled artifacts.'),
    gate('controlled_source_scope', 'passed', 'The only real-video source referenced is the approved Phase 32 private export; IMG_6024.MOV and arbitrary media are excluded.'),
    gate('privacy_security', 'passed', 'No public URL, signed URL, provider call, public bucket access, or secret is part of Phase 36G.'),
    gate('blocked_features', 'passed', 'Production, external beta, paid production, broad media, providers, Revideo, FILM, and slow motion stay blocked.'),
    gate('phase37a_scope', 'passed', 'Phase 37A may start only as OCR approval workflow; this is not product beta or Demucs runtime approval.'),
  ]
}

function gate(
  gateId: AudioStackDemucsQaGate['gateId'],
  status: AudioStackDemucsQaGate['status'],
  summary: string,
): AudioStackDemucsQaGate {
  return { gateId, status, summary }
}
