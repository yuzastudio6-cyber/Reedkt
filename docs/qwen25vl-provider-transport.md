# Qwen2.5-VL Provider Transport

The provider transport is server-only. It supports OpenAI-compatible chat completions with multimodal `image_url` parts and a generic JSON POST profile for owner-approved providers.

The request includes marker metadata, attachment labels only, a source video label, sampled frame data URLs, and a visual task prompt. It excludes raw full-video upload, audio bytes, secrets, provider headers, unfetched URL contents, full project history, worker commands, render/export commands, credit actions, and chain-of-thought.

Responses are parsed as JSON, redacted for diagnostics, and passed through structured validation. Raw provider payloads are not stored or returned to the browser.
