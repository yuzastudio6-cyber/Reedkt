import type { AgentToolRoutingPolicy } from './shared-agent-tool-architecture-types'

export const agentToolRoutingPolicy: AgentToolRoutingPolicy = {
  policyId: 'phase52a-agent-tool-routing-policy',
  steps: [
    'Specialist agents produce structured findings and edit intents only.',
    'Coordinator converts accepted intents into candidate plans.',
    'Producer Agent checks scope, cost, readiness, permissions, and privacy.',
    'QA/Safety Agent checks policy, artifact privacy, hallucination risk, and blocked features.',
    'Approved plan snapshot is created only after the gate passes.',
    'Workers execute only the approved plan snapshot.',
  ],
  constraints: [
    'Agents cannot execute tools directly.',
    'Agents cannot authorize raw prompt execution.',
    'Workers reject raw chat as instructions.',
    'Workers reject unknown scope, tool, action, bucket, or prefix.',
    'VLM-dependent intents respect Track B VLM exclusion until resolved.',
    'Demucs-dependent intents respect the Demucs provenance blocker until resolved.',
  ],
  ownerRouting: [
    { agentId: 'graphics_design', routesTo: 'ai_tools_chat', notes: 'Creative graphics route to AI Tools manifests.' },
    { agentId: 'map_location', routesTo: 'this_chat', notes: 'Geospatial plans route to map stack manifests.' },
    { agentId: 'search_research', routesTo: 'this_chat', notes: 'Source/capture/extraction route to web search manifests.' },
    { agentId: 'audio', routesTo: 'track_b', notes: 'Audio intents route to Track B manifests.' },
    { agentId: 'colorist', routesTo: 'track_a_visual_video', notes: 'Color intents route to Track A visual-video manifests.' },
    { agentId: 'compositor_vfx', routesTo: ['track_a_visual_video', 'ai_tools_chat'], notes: 'Compositing routes to Track A; graphic assets route to AI Tools.' },
    { agentId: 'motion', routesTo: ['track_a_visual_video', 'ai_tools_chat'], notes: 'Slow-motion/video motion routes to Track A; motion graphics route to AI Tools.' },
    { agentId: 'editor', routesTo: ['track_a_visual_video', 'track_b'], notes: 'Pacing uses visual-video and speech/audio evidence.' },
  ],
  blockedRoutes: [
    'direct agent-to-tool execution',
    'raw prompt to worker execution',
    'unrestricted provider fallback',
    'production/external beta/broad media execution',
  ],
}
