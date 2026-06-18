import {
  readTrackaBuildContextGenerationApprovalArtifacts,
  summarizeTrackaBuildContextGenerationApproval,
} from '../activation/open-source-tool-stack-tracka-build-context-generation-approval'

const reports = readTrackaBuildContextGenerationApprovalArtifacts()

console.log(summarizeTrackaBuildContextGenerationApproval(reports))
