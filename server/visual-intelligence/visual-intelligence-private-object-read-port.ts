/**
 * Server-only immutable object reread boundary used by Visual Intelligence
 * release and account-effective pricing authorities. Keeping this contract in
 * the capability prevents Visual Intelligence from depending on a transcript
 * worker's implementation-specific storage port.
 */
export interface VisualIntelligencePrivateObjectReadPort {
  readExact(input: {
    readonly bucketName: string
    readonly objectName: string
    readonly generation?: string
    readonly etag?: string
  }): Promise<{
    readonly body: Buffer
    readonly generation: string
    readonly etag: string
    readonly contentType: string
  } | null>
}
