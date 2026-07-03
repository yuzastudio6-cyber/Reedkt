import {
  forbiddenOutputsPresent,
  protectedFilesHaveNoDiff,
  readTrackBMilestone2VideoAnalysisExecutionArtifacts,
} from '../activation/trackb-media-oss-milestone-2-video-analysis-execution/index.js'

const reports = readTrackBMilestone2VideoAnalysisExecutionArtifacts()
const acceptableDecisions = new Set([
  'trackb_media_oss_milestone2_video_analysis_execution_passed_all_three_tools_cpu_bounded',
  'trackb_media_oss_milestone2_video_analysis_execution_passed_with_pyav_fixture_deferred',
  'trackb_media_oss_milestone2_video_analysis_execution_passed_with_pyscenedetect_fixture_deferred',
  'trackb_media_oss_milestone2_video_analysis_execution_passed_with_pyav_and_pyscenedetect_fixtures_deferred',
])

if (!acceptableDecisions.has(reports.decisionReport.decision)) {
  throw new Error(`unexpected_or_blocked_decision:${reports.decisionReport.decision}`)
}
if (reports.decisionReport.endToEndProductReadyTools !== 0) throw new Error('product_ready_tools_claimed')
if (reports.decisionReport.fortyPlusEndToEndClaimAllowed !== false) throw new Error('forty_plus_claim_allowed')
if (reports.decisionReport.ffmpegFfprobeCommandRunInThisPhase !== false) throw new Error('ffmpeg_ffprobe_command_claimed')
if (reports.decisionReport.realUserMediaUsed !== false) throw new Error('real_user_media_claimed')
if (!protectedFilesHaveNoDiff()) throw new Error('protected_files_changed')
const outputs = forbiddenOutputsPresent()
if (outputs.length) throw new Error(`forbidden_outputs_present:${outputs.join(',')}`)

console.log('Track B Milestone 2 video analysis execution smoke passed.')
