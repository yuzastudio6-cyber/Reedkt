# GitHub Merge Hygiene Parent-Chain Merge Execution

This prompt may be used only in a separate execution phase after PR #350 lands.

Resume start point: #298.

PR #337 frozen head SHA status:

- Review decision: `accepted_pr_337_new_head_sha`
- Expected SHA for PR #337: `381afa79e1074f18fd28a2c555c22f4cd595cb38`

Frozen batch merge targets are exactly:

- #205 `bbc357b7ddb4f56117252f72e5909f3f7f399098`
- #222 `03680b3b5795c9c63d6b25b0a45d2e35a4774f36`
- #247 `a1f72046af6a1150ed71f04425fc4be27abe7f36`
- #248 `bdc0362705b05ace64c3f52e5c951198a41e59f2`
- #252 `acbecccd5e7b9fa40ec743b305bc410fa1bd2d90`
- #259 `2cdedc2a5cb65b9bed5ae8da77073eda1aa79c10`
- #262 `bac80ccd7384819de29e0ce710fd5e963700ad2e`
- #265 `082d8681f92180b673a35e80767306794be5a3e2`
- #269 `e6ed4f2dbf6f772a8ffb9dcf7c9e7a482798ef2d`
- #271 `a9fa107beb98af4995af8eb7137b594363fad88d`
- #274 `4d7c5d17dd2eace174f2f0776d01b442e4d6b36f`
- #276 `f8583af0b9e3cd6765773a0634c244ac664c193d`
- #280 `dd3659f9c651cf4da39dcacf308e621c2b4c3b94`
- #283 `a423098274a670c6b4d75ca4d4596a9ec2a2b2c5`
- #292 `e194187225c2d1fc5d2f9fe342826b54e118cdf0`
- #298 `6c0c055a7a2b9844ff4f00efe8dbd1ca75e8dbdd`
- #299 `61c715c5dd42d2180cfa823e3c03f11d7a0cc482`
- #302 `d2581a09844f834cc453ea4548267526daab7b78`
- #306 `93a4afc0853ddbb983bd8663d4fa4a6c2c9d51e1`
- #309 `aa9bac85ce7334e171cb233350b66edb37512fc0`
- #311 `1493ab86881e58990534a6007b5ecbd2eb7d39fb`
- #314 `dc83d8368125332ef51a26a17745fc6b98d3e29a`
- #318 `64a52452893c47d7a5972134243af313a2b76ac9`
- #320 `6fa75c385481a6fbbaeac42e969fbb9b37c16147`
- #322 `ce50e3548c4bc493bd2ad903c384088321e5bb71`
- #327 `6bf552c6ed330cc5843389a5bac20e17c5551c05`
- #337 `381afa79e1074f18fd28a2c555c22f4cd595cb38`

Rules:

- Merge only PRs listed in `docs/github-merge-hygiene/frozen-merge-batch.json` with `approvedForFutureMerge=true`.
- Verify each PR's head SHA before merge.
- Merge parent PRs first.
- Do not merge draft PRs.
- Do not merge dirty or unstable PRs.
- Do not merge duplicate-risk PRs unless they are explicitly marked canonical in the approval packet.
- Verify the target branch contains each merged commit after every merge.
- Stop on any changed PR state, draft flag, merge state, head SHA, base branch, new conflict, missing parent, or unexpected CI/validation category.
- Do not merge PRs outside the frozen batch.
- Do not execute runtime paths, mutate Supabase, call providers, run workers/tools/routes, process media, create public artifacts, issue signed URLs, deploy production, unlock external beta, unlock paid production, or execute raw prompts.
