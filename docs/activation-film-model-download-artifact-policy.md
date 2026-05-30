# FILM Model Download Artifact Policy

Phase 38B stores only private model-weight artifacts and sanitized evidence.

## Private GCS Layout

Target prefix:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/`

Expected model files:

- `film_net/Style/saved_model/keras_metadata.pb`
- `film_net/Style/saved_model/saved_model.pb`
- `film_net/Style/saved_model/variables/variables.data-00000-of-00001`
- `film_net/Style/saved_model/variables/variables.index`

Expected evidence files:

- `file_checksums_sha256.txt`
- `model_tree_manifest.json`
- `source_evidence.json`
- `license_evidence.json`
- `download_report.json`

## Git Safety

Do not commit FILM Saved Model files, temporary downloads, generated media, private JSON reports from GCS, logs, credentials, public URLs, Docker output, or large binaries.

`package-lock.json` should remain unchanged.
