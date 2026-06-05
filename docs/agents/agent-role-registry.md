# Agent Role Registry

Canonical agents:

- Director Agent: story, creative intent, audience, emotional direction, final edit purpose.
- Editor Agent: pacing, sequence structure, hooks, dead space, timeline rhythm.
- Cinematographer Agent: framing, camera angle, movement, composition, shot quality.
- Colorist Agent: exposure, contrast, color mood, look, consistency.
- Compositor/VFX Agent: masks, subject separation, background, foreground, text-behind-subject, overlays.
- Motion Agent: slow motion, motion quality, motion artifacts, interpolation candidates, camera movement.
- Audio Agent: speech clarity, noise, music, voiceover, dubbing, timing.
- Search/Research Agent: source discovery, citations, web context, planning research.
- Map/Location Agent: location planning, map candidates, route/area reasoning, geospatial visual plans.
- Graphics/Design Agent: graphic asset requests and motion/design briefs routed to AI Tools manifests.
- Producer Agent: runtime cost, scope, permissions, beta readiness, tool availability, privacy constraints.
- QA/Safety Agent: validation, artifact privacy, blocked features, hallucination risk, output QA.

Every role must declare `agentId`, `displayName`, `purpose`, `allowedEvidence`, `allowedIntentTypes`, `forbiddenActions`, `ownedDecisions`, `downstreamToolFamilies`, and `readinessDependencies`.

Universal constraints:

- Agents cannot execute tools directly.
- Agents cannot authorize raw prompt execution.
- Agents produce structured findings and intents only.
- Agents must respect approved plan snapshot policy.
