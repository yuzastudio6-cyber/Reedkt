/**
 * Removes implementation/testing vocabulary from legacy preference fixtures before
 * it reaches normal user surfaces. Internal records retain their exact provenance.
 */
export function toEditPreferenceUserCopy(value: string): string {
  return value
    .replace(/\bmock project setup\b/gi, 'project setup preview')
    .replace(/\bmock application\b/gi, 'preview application')
    .replace(/\bmock edit plan\b/gi, 'draft edit plan')
    .replace(/\bmock QA\b/gi, 'quality review')
    .replace(/\bmock SFX\b/gi, 'planned SFX')
    .replace(/\bmock filtering tests?\b/gi, 'private testing')
    .replace(/\bmock conflict\b/gi, 'preference conflict')
    .replace(/\bmock\b/gi, 'preview')
    .replace(/\bQwen\b/gi, 'analysis')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
