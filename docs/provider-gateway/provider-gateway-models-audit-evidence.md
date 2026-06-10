# PROVIDER-0 Official Evidence

The PROVIDER-0 audit records these sources as planning evidence. Future live
provider phases must re-check current docs on their execution date.

## DeepSeek

- [DeepSeek API Pricing](https://api-docs.deepseek.com/quick_start/pricing):
  official pricing/rate-limit source for `deepseek-v4-pro` and
  `deepseek-v4-flash`.
- [DeepSeek API Docs](https://api-docs.deepseek.com/): official API surface
  source for OpenAI-compatible and Anthropic-compatible endpoints, JSON output,
  and tool-call support.
- [DeepSeek API Changelog](https://api-docs.deepseek.com/updates): official
  update source for model-family availability and API changes.

## Qwen / Alibaba Model Studio

- [Alibaba Model Updates](https://help.aliyun.com/zh/model-studio/newly-released-models):
  official model-update source identifying `qwen3.7-max`.
- [Alibaba Model Pricing](https://help.aliyun.com/zh/model-studio/model-pricing):
  official pricing source with `qwen3.7-max` alias/snapshot context including
  `qwen3.7-max-2026-06-08` and older `qwen3.7-max-2026-05-20` evidence.
- [OpenAI-Compatible Qwen API](https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope):
  official compatibility source for DashScope/OpenAI-style API integration.
- [First API Call to Qwen](https://www.alibabacloud.com/help/en/model-studio/first-api-call-to-qwen):
  official key setup source for Qwen/DashScope semantics.
- [Qwen official blog target](https://qwen.ai/blog?id=qwen3.7): official Qwen
  release/blog URL to re-check in later phases.

Reuters Qwen3-Max reporting is useful historical context for agent/coding
capability claims, but it is not the exact API contract for this integration.
The PROVIDER-0 integration target is `qwen3.7-max`.
