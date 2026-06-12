# Qwen/DeepSeek Agent Brain Recommendation

Qwen may become the default agent-brain candidate only after a separate dry-run approval packet. DeepSeek may become a coding/reasoning fallback only after the same kind of approval.

Required flow: user/chat request -> agent findings -> edit intents -> approved plan snapshot -> later worker execution.

Provider responses must never directly mutate Supabase, call tools/workers/routes, create public artifacts, or become signed URL source-of-truth records.
