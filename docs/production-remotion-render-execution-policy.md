# Production Remotion Render Execution Policy

Remotion is the primary M16A programmatic composition/render engine.

Remotion command plans are allowlisted and receive private render-manifest props only. They reject arbitrary user args, user JS/code injection, raw prompt instructions, provider calls, and Revideo.

Local-dev Remotion render is opt-in and skip-safe. It runs only when `enableRemotionLocalRender=true`, readiness/package checks pass, paths are safe, and validation has passed.
