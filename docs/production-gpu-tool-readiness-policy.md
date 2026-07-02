# Production GPU Tool Readiness Policy

GPU readiness is dry-run by default in Milestone 11.

Dry-run validates package declarations, model-weight manifest templates, runtime policy, and Cloud Run GPU template metadata. It does not import GPU packages, require a local GPU, load model weights, run inference, process media, or download anything.

Optional real import checks may be enabled later in a controlled environment. They are import-only and non-strict by default. They must not load checkpoints, run inference, contact providers, or require GPU availability unless an explicit later strict check asks for it.
