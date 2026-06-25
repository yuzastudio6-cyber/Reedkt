# Fixture Execution Receipts

The fixture execution lane validates 16 internal fixture receipts in deterministic ranking order. Every receipt carries an approved snapshot, edit plan, credit reservation, idempotency key, private source-of-truth artifact reference, QA gate, fallback policy, result schema, and sanitized log summary.

This is not user-media processing and not direct runtime approval. The receipt lane records that OpenColorIO and OpenImageIO are included in the all-tool internal fixture sequence after Sharp/libvips and before ImageMagick.
