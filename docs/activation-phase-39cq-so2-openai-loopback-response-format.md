# Phase 39C-Q-SO2 OpenAI Loopback Response Format

SO2 may start a vLLM OpenAI-compatible server only inside the staging Cloud Run Job and only on `127.0.0.1`. It is not a public service and is not an external provider API.

Allowed loopback strategies:

- `O1`: `response_format` with `json_schema`
- `O2`: request body `structured_outputs` with JSON schema where supported
- `O3`: request body `structured_outputs` with grammar where supported
- `O4`: structural tag protocol where supported and direct final JSON validates
- `O5`: strict prompt diagnostic only, never pass-counting

Loopback requests use deterministic settings: temperature `0`, `top_p` `1`, max tokens `<=256`, one prompt at a time, and one generated image at a time for image tests. `chat_template_kwargs: {"enable_thinking": false}` is attempted and any rejection is recorded safely.

External OpenAI, Qwen, DashScope, Hugging Face Inference Provider, or public URL calls remain blocked.
