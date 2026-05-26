# Production Music Ducking Execution Policy

Music ducking is voice-first. Music and SFX must not overpower speech.

M15A creates ducking execution metadata from overlap findings, transcript/timeline context, and approved audio plans. It does not final mux a mixed audio track. Demucs is not a default path; it is only planned when overlap or an approved plan reason justifies separation.

If the approved plan is voice-only, no music is added. If overlap confidence is weak, the runner warns instead of pretending separation or beat detection happened.
