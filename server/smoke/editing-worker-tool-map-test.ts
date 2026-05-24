import { CURRENT_MILESTONE_REQUIRED_TOOL_IDS, EDITING_TOOL_IDS } from '../tools/editing-tool-contracts'
import {
  EDITING_WORKER_TOOL_MAP,
  listEditingWorkerToolMappings,
} from '../tools/editing-worker-tool-map'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

const knownTools = new Set(EDITING_TOOL_IDS)
const mappings = listEditingWorkerToolMappings()

assert(mappings.length === Object.keys(EDITING_WORKER_TOOL_MAP).length, 'Worker mappings should be listable.')

for (const mapping of mappings) {
  assert(mapping.toolIds.length > 0, `${mapping.workerId} should map to at least one tool.`)
  const uniqueTools = new Set(mapping.toolIds)
  assert(uniqueTools.size === mapping.toolIds.length, `${mapping.workerId} should not contain duplicate tools.`)
  for (const toolId of mapping.toolIds) {
    assert(knownTools.has(toolId), `${mapping.workerId} maps to unknown tool ${toolId}.`)
  }
}

const allMappedTools = new Set(mappings.flatMap((mapping) => mapping.toolIds))
for (const toolId of CURRENT_MILESTONE_REQUIRED_TOOL_IDS) {
  assert(allMappedTools.has(toolId), `Passed-gate required tool ${toolId} should appear in a worker mapping.`)
}

assert(
  EDITING_WORKER_TOOL_MAP['media-analysis-worker'].includes('whisper')
    && EDITING_WORKER_TOOL_MAP['media-analysis-worker'].includes('pyscenedetect'),
  'Media analysis worker should include planned transcription and scene detection tools.',
)
assert(
  EDITING_WORKER_TOOL_MAP['render-worker'].includes('remotion')
    && EDITING_WORKER_TOOL_MAP['render-worker'].includes('ffmpeg')
    && EDITING_WORKER_TOOL_MAP['render-worker'].includes('ffprobe'),
  'Render worker should include Remotion, FFmpeg, and FFprobe.',
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'workers_map_only_known_tools',
    'workers_have_tools',
    'passed_gate_tools_mapped',
    'media_analysis_future_tools_mapped',
  ],
  workerCount: mappings.length,
  mappedToolIds: [...allMappedTools].sort(),
}))
