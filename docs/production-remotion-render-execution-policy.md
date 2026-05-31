# Production Remotion Render Execution Policy

Remotion is the primary M16A programmatic composition/render engine.

Remotion command plans are allowlisted and receive private render-manifest props only. They reject arbitrary user args, user JS/code injection, raw prompt instructions, provider calls, and Revideo.

Local-dev Remotion render is opt-in and skip-safe. It runs only when `enableRemotionLocalRender=true`, readiness/package checks pass, paths are safe, and validation has passed.

Phase 45B validates Remotion only through a dedicated private staging validation job and bounded preview artifact for `phase45b-20260531T19552`. This evidence does not approve final delivery, public delivery, product beta, production, providers, Revideo, Track B tools, or arbitrary media.
