# Phase 36I Signalsmith Source Selection Policy

Phase 36I uses exact source identity only.

- Use tag `1.1.0` at commit `44c8f865af9da8c29cc4a70a2d5a3ec83639c711`.
- Do not use floating `main` as the runtime identity.
- Fetch source into temp storage only.
- Compute and commit source/header/license checksum metadata, not source archives or vendored third-party source.
- Do not use unofficial forks, wrappers, npm packages, Python bindings, or Rust wrappers for Phase 36I.

If exact source fetch, submodule checkout, commit verification, or checksum generation fails, Phase 36I remains blocked with `signalsmith_exact_source_fetch_or_verification_incomplete`.
