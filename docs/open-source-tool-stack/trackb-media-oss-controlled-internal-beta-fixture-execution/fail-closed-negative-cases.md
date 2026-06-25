# Fail Closed Negative Cases

The fixture receipt validator rejects missing approved snapshot metadata, missing QA gate linkage, public or signed artifact paths, and raw prompt payload keys.

These checks preserve the PR #779 dry-run safety boundary while advancing the lane to internal fixture QA review.
