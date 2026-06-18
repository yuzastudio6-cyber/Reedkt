import {
  buildTrackaBuildContextGenerationApprovalReports,
  readTrackaBuildContextGenerationApprovalArtifacts,
} from '../activation/open-source-tool-stack-tracka-build-context-generation-approval'

const reports =
  readTrackaBuildContextGenerationApprovalArtifacts() ?? buildTrackaBuildContextGenerationApprovalReports()

console.log(JSON.stringify(reports, null, 2))
