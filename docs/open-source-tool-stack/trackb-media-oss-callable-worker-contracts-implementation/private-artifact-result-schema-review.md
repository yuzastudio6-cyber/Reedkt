# Private Artifact And Result Schema Review

Future Track B tool-call results must use private source-of-truth storage references only. Public artifacts, signed URLs, raw prompts, raw chat, and provider prompts are explicitly excluded from the result schema.

The contract requires sanitized log summaries rather than raw worker logs.
