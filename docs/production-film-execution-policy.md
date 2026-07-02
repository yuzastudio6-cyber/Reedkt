# Production FILM Execution Policy

FILM is the planned M15D frame interpolation engine for selected slow-motion clip ranges. It must not be applied to the whole project by default.

Production FILM execution requires an approved `film_model` manifest, readiness gates, private source/proxy refs, and slow-motion QA. Current `needs_review` templates block production use.

Slow-motion QA must review ghosting, warped faces/people, duplicated objects, and motion trails. Local-dev execution skips cleanly when FILM, a checkpoint, or safe source clips are unavailable, and no checkpoint download is attempted.
