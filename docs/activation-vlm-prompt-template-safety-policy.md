# VLM Prompt Template Safety Policy

Phase 39C prompts are fixed templates tied to deterministic generated fixtures. Raw prompt execution is blocked.

Each template must request JSON only and must include no tool call, browsing, provider, secret, URL, arbitrary file, or user-media instruction. Outputs are advisory QA metadata and must include uncertainty instead of overconfident guesses.

The prompt schema is limited to fixture id, prompt template id, model id, model revision, runtime, objects, text-like regions, safe-zone suggestions, spatial relations, uncertainty, blocked actions, and QA flags.
