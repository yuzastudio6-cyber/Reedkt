import { writeBatch1FinalRollupArtifacts } from '../activation/open-source-tool-stack-batch-1-final-rollup-after-ffmpeg-ffprobe-proof'

const reports = writeBatch1FinalRollupArtifacts()

console.log(JSON.stringify(reports.decision, null, 2))
