import type { TrackIntegrationOwnershipEntry, TrackIntegrationOwnershipMatrix } from './track-integration-audit-types'

function entry(
  toolId: string,
  owner: TrackIntegrationOwnershipEntry['owner'],
  productScope: string,
  status: TrackIntegrationOwnershipEntry['status'],
  notes: string,
): TrackIntegrationOwnershipEntry {
  return { toolId, owner, productScope, status, notes }
}

export function buildTrackIntegrationOwnershipMatrix(): TrackIntegrationOwnershipMatrix {
  const trackATools = [
    entry('ffmpeg', 'Track A', 'final render/export hardening and private review validation', 'active_internal', 'Track B may reference FFmpeg for audio/OCR evidence, but Track A owns render/export hardening.'),
    entry('ffprobe', 'Track A', 'render/export validation metadata', 'active_internal', 'Used for private review validation only.'),
    entry('libass', 'Track A', 'caption burn-in validation', 'active_internal', 'Validated in Phase 45A.'),
    entry('remotion', 'Track A', 'private render validation', 'active_internal', 'Validated in Phase 45B; Revideo remains blocked.'),
    entry('opentimelineio', 'Track A', 'timeline metadata validation', 'active_internal', 'Validated in Phase 45C.'),
    entry('opencolorio', 'Track A', 'pro color/image color transform validation', 'active_internal', 'Validated in Phase 40D.'),
    entry('openimageio', 'Track A', 'pro image read/write/metadata validation', 'active_internal', 'Validated in Phase 40D.'),
    entry('birefnet', 'Track A', 'controlled one-frame mask evidence', 'active_internal', 'Prior Track A mask evidence only.'),
    entry('sam2', 'Track A', 'controlled temporal masks and private feature E2E', 'active_internal', 'Validated through Phase 35F for controlled private feature E2E.'),
    entry('kornia', 'Track A', 'CPU generated/real-frame image tensor validation', 'active_internal', 'Validated in Phase 40B/40D.'),
    entry('real_esrgan', 'Track A', 'bounded enhancement sample and policy decision', 'active_internal', 'Ready only inside Track A private visual-video scope.'),
    entry('film', 'Track A', 'bounded slow-motion/interpolation sample evidence', 'active_internal', 'Validated as controlled Track A sample; full-video remains blocked.'),
    entry('full_visual_video_private_e2e', 'Track A', 'private visual-video review workflow', 'active_internal', 'Closed by Phase 45F readiness audit.'),
  ]
  const trackBTools = [
    entry('deepfilternet', 'Track B', 'speech cleanup, enhance speech, remove background noise', 'active_internal', 'Active internal speech cleanup engine after Phase 36F.'),
    entry('demucs', 'Track B', 'vocal/music/stem separation candidate', 'blocked', 'Blocked until pretrained-model license/provenance is approved.'),
    entry('signalsmith_stretch', 'Track B', 'future audio stretch planning candidate', 'blocked', 'No execution in Phase 47A.'),
    entry('paddleocr', 'Track B', 'OCR safe-zone planning and metadata', 'active_internal', 'Track B OCR metadata contracts reached Phase 37E.'),
    entry('paddlepaddle', 'Track B', 'OCR runtime framework', 'active_internal', 'Approved only for bounded OCR runtime phases already completed.'),
    entry('qwen3_vl', 'Track B', 'VLM frame understanding candidate', 'blocked', 'Blocked by Phase 39C generated VLM runtime OOM.'),
    entry('vlm', 'Track B', 'visual-language model planning hints', 'blocked', 'No controlled real-frame VLM until Phase 39C runtime is resolved.'),
    entry('vllm', 'Track B', 'VLM serving/runtime candidate', 'blocked', 'Phase 39C L4 profiles failed with CUDA OOM.'),
    entry('opencv', 'Track B', 'future CV metadata/tooling', 'blocked', 'No new runtime execution in Phase 47A.'),
    entry('pyav', 'Track B', 'future video metadata/tooling', 'blocked', 'No new runtime execution in Phase 47A.'),
    entry('pyscenedetect', 'Track B', 'future scene metadata/tooling', 'blocked', 'No new runtime execution in Phase 47A.'),
    entry('sharp', 'Track B', 'future image/data tooling', 'blocked', 'No new runtime execution in Phase 47A.'),
    entry('duckdb', 'Track B', 'future data analysis/routing', 'blocked', 'No new runtime execution in Phase 47A.'),
    entry('polars', 'Track B', 'future data analysis/routing', 'blocked', 'No new runtime execution in Phase 47A.'),
    entry('hybrid_compute', 'Track B', 'future CPU/GPU routing', 'blocked', 'Blocked until later Track B readiness work.'),
  ]
  const inactiveTools = [
    entry('rnnoise', 'Inactive', 'none in active product routing', 'inactive_removed', 'Removed from active product routing in Phase 36G; retained only as historical/internal metadata if present.'),
    entry('revideo', 'Evaluation only', 'none in active execution', 'evaluation_only', 'Revideo remains evaluation-only and blocked from execution.'),
  ]

  return {
    trackATools,
    trackBTools,
    inactiveTools,
    sharedInfrastructureNotes: [
      'FFmpeg/FFprobe are Track A-owned for render/export hardening, while Track B audio/OCR phases may reference them only inside their own bounded evidence scopes.',
      'No tool in Phase 47A is installed, built, deployed, or executed.',
    ],
    conflicts: [],
  }
}
