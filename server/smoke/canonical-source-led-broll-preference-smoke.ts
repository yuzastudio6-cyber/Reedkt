import assert from 'node:assert/strict'

import {
  classifySourceLedBRollPreference,
} from '../services/canonical-source-led-plan-presentation-service'

for (const value of [
  undefined,
  '',
  '   ',
]) {
  assert.equal(
    classifySourceLedBRollPreference(value),
    'not_specified',
  )
}

for (const value of [
  'none',
  'source_only',
  'Source footage only',
  'No B-roll.',
  'Do not add B-roll; keep the real speaker and source footage primary.',
  'Use only the uploaded source.',
  'No additional b roll unless later approved.',
]) {
  assert.equal(
    classifySourceLedBRollPreference(value),
    'explicit_non_use',
    value,
  )
}

for (const value of [
  'Use product B-roll.',
  'Use only source-supported product details.',
  'Keep the source primary and add B-roll where useful.',
  'No random B-roll.',
  'Do not add unnecessary B-roll.',
  'No B-roll except product close-ups.',
  'No B-roll unless it supports an important point.',
]) {
  assert.equal(
    classifySourceLedBRollPreference(value),
    'asset_planning_required',
    value,
  )
}

console.log(
  'Canonical source-led explicit B-roll non-use classification smoke passed.',
)
