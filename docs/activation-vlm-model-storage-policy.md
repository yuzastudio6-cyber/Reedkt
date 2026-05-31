# Phase 39A VLM Model Storage Policy

Phase 39A creates no storage objects. It only records the future private model-weight prefix:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/<revision>/`

Phase 39B must replace `<revision>` with an exact immutable revision before download. It must record every selected model, tokenizer, processor, config, index, and metadata file before download, compute SHA-256 for every file, and upload only to private generated-assets storage after current-shell confirmations are set.

The following are never allowed in git:

- model weight shards
- tokenizer or processor payloads
- generated model files
- temp download folders
- node_modules or venvs
- credentials, secrets, or signed URLs
- media files or arbitrary user files

Phase 39C runtime code must use private local model paths only and fail closed if vLLM, Transformers, or any helper tries to download model files at runtime.
