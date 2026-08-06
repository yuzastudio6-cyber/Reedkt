declare module 'sharp' {
  interface Metadata {
    format?: string
    width?: number
    height?: number
    channels?: number
    hasAlpha?: boolean
  }
  interface RawBufferInfo {
    width: number
    height: number
    channels: number
  }
  interface RawBufferResult {
    data: Buffer
    info: RawBufferInfo
  }
  interface Sharp {
    resize(options: Record<string, unknown>): Sharp
    png(options: Record<string, unknown>): Sharp
    jpeg(options: Record<string, unknown>): Sharp
    webp(options: Record<string, unknown>): Sharp
    flatten(options: Record<string, unknown>): Sharp
    ensureAlpha(alpha?: number): Sharp
    raw(options?: Record<string, unknown>): Sharp
    toBuffer(): Promise<Buffer>
    toBuffer(options: { resolveWithObject: true }): Promise<RawBufferResult>
    metadata(): Promise<Metadata>
  }
  interface SharpFactory {
    (input: Buffer, options?: Record<string, unknown>): Sharp
  }
  const sharp: SharpFactory
  export default sharp
}
