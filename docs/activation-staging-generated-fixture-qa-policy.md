# Activation Staging Generated-Fixture QA Policy

Phase 25 QA verifies only generated-fixture staging behavior.

The QA job should confirm:

- analysis and timeline artifacts exist;
- preview and final-export artifacts exist where the safe render path ran;
- artifacts are private bucket/object references;
- no provider, model download, GPU, public access, secret value, or real user
  media path was used.

Passing Phase 25 QA can prepare Phase 26 model approval workflow. It does not
mark production ready, open external beta, or allow real user media testing.
