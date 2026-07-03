import {
  readTrackaBuildContextGenerationArtifacts,
  writeTrackaBuildContextGenerationArtifacts,
} from '../activation/open-source-tool-stack-tracka-build-context-generation-execution'

const reports = readTrackaBuildContextGenerationArtifacts() ?? writeTrackaBuildContextGenerationArtifacts()
console.log(JSON.stringify(reports, null, 2))
