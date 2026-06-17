import { buildCorrectedAssSidecar, buildTrackaCaptionBurninBundle } from '../activation/tracka-caption-burnin-revalidation'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

const ass = buildCorrectedAssSidecar()

assert(ass.includes('Hey everyone — welcome to this ReEditPro visual review.'), 'corrected caption line 1 missing')
assert(ass.includes('Today we are testing captions, overlays, and private render quality.'), 'corrected caption line 2 missing')
assert(ass.includes('The goal is a clean, professional edit with readable text.'), 'corrected caption line 3 missing')
assert(ass.includes('Review this sample for timing, polish, and visual clarity.'), 'corrected caption line 4 missing')
assert(!ass.includes('Hey guys, I saw how you guys doing today is going to do going to be the first'), 'rejected #419 caption text leaked into sidecar')

const bundle = await buildTrackaCaptionBurninBundle({ execute: false })

assert(bundle.sourceAudit.status === 'passed', 'source audit must pass')
assert(bundle.summary.execution === 'blocked_pending_caption_burnin_execution_confirmation', 'dry smoke must remain confirmation-blocked')
assert(bundle.runtimeResolution.blocker === 'blocked_missing_approved_private_source_ref', 'missing approved source blocker must be explicit')
assert(bundle.summary.libassBurninExecuted === false, 'libass must not run in smoke')
assert(bundle.summary.remotionPreviewExecuted === false, 'Remotion must not run in smoke')
assert(bundle.summary.ffmpegValidationExecuted === false, 'FFmpeg must not run in smoke')
assert(bundle.summary.ffprobeValidationExecuted === false, 'FFprobe must not run in smoke')
assert(bundle.summary.gcsAccess === false, 'GCS must not be accessed in smoke')
assert(bundle.summary.signedUrlsCreated === false, 'signed URLs must not be created')
assert(bundle.summary.publicArtifactsCreated === false, 'public artifacts must not be created')

console.log(JSON.stringify({
  status: 'passed',
  phase: bundle.summary.phase,
  runId: bundle.runId,
  execution: bundle.summary.execution,
  sourceAudit: bundle.sourceAudit.status,
  expectedGuardedBlocker: bundle.runtimeResolution.blocker,
  libassBurninExecuted: false,
  remotionPreviewExecuted: false,
  ffmpegValidationExecuted: false,
  ffprobeValidationExecuted: false,
  gcsAccess: false,
  signedUrlsCreated: false,
  publicArtifactsCreated: false,
  internalBetaReady: false,
}, null, 2))
