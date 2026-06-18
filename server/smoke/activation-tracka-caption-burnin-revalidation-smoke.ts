import { buildCorrectedAssSidecar, buildTrackaCaptionBurninBundle } from '../activation/tracka-caption-burnin-revalidation'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

const ass = buildCorrectedAssSidecar()

assert(ass.includes('Hey everyone — welcome to this\\NReEditPro visual review.'), 'layout-fixed corrected caption line 1 missing')
assert(ass.includes('Today we are testing captions,\\Noverlays, and private render quality.'), 'layout-fixed corrected caption line 2 missing')
assert(ass.includes('The goal is a clean, professional edit\\Nwith readable text.'), 'layout-fixed corrected caption line 3 missing')
assert(ass.includes('Review this sample for timing,\\Npolish, and visual clarity.'), 'layout-fixed corrected caption line 4 missing')
assert(ass.includes('PlayResX: 2160'), 'layout fixed PlayResX missing')
assert(ass.includes('PlayResY: 3840'), 'layout fixed PlayResY missing')
assert(ass.includes('Arial,132'), 'layout fixed font size missing')
assert(ass.includes(',2,190,190,250,1'), 'layout fixed alignment/margins missing')
assert(!ass.includes('Hey guys, I saw how you guys doing today is going to do going to be the first'), 'rejected #419 caption text leaked into sidecar')

const bundle = await buildTrackaCaptionBurninBundle({ execute: false })

assert(bundle.summary.phase === 'TRACKA-CAPTION-QUALITY-5', 'phase must be CQ5')
assert(bundle.sourceAudit.status === 'passed', 'source audit must pass')
assert(bundle.approvedSourceRef.sourceRefApproved === true, 'approved #452 source ref must load')
assert(bundle.runtimeResolution.approvedRuntimePathFound === true, 'approved #463 runtime path must load')
assert(bundle.runtimeResolution.approvedRuntimePath === 'repo_owned_render_worker_ffmpeg_libass_runtime_path', 'approved runtime path must match #463')
assert(bundle.summary.execution === 'blocked_caption_layout_fix_confirmation_missing', 'dry smoke must remain confirmation-blocked')
assert(bundle.summary.sourceGcsReadConfirmationProvided === false, 'source GCS read confirmation must be absent in smoke')
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
  approvedSourceRef: bundle.summary.approvedSourceRef,
  sourceRefApproved: bundle.summary.sourceRefApproved,
  approvedRuntimePath: bundle.summary.approvedRuntimePath,
  runtimePathApproved: bundle.summary.runtimePathApproved,
  sourceAudit: bundle.sourceAudit.status,
  expectedGuardedBlocker: 'blocked_caption_layout_fix_confirmation_missing',
  libassBurninExecuted: false,
  remotionPreviewExecuted: false,
  ffmpegValidationExecuted: false,
  ffprobeValidationExecuted: false,
  gcsAccess: false,
  signedUrlsCreated: false,
  publicArtifactsCreated: false,
  internalBetaReady: false,
}, null, 2))
