import {
  professionalLongFormCustomerDeliveryBrowserReviewSchema,
  type ProfessionalLongFormCustomerDeliveryBrowserReview,
} from '../backend/api/professional-long-form-customer-delivery-browser-contracts'
import {
  PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MAX_RANGE_BYTES,
  readProfessionalLongFormCustomerDeliveryDownloadRange,
  type ProfessionalLongFormCustomerDeliveryClientInput,
} from './professional-long-form-customer-delivery-client'

type PrivateDownloadFilePickerOptions = {
  suggestedName: string
  types: Array<{
    description: string
    accept: Record<string, string[]>
  }>
  excludeAcceptAllOption: boolean
}

type PrivateDownloadWritableFile = {
  write(data: Uint8Array): Promise<void>
  close(): Promise<void>
  abort(reason?: unknown): Promise<void>
}

type PrivateDownloadFileHandle = {
  createWritable(options: {
    keepExistingData: false
  }): Promise<PrivateDownloadWritableFile>
}

type PrivateDownloadFilePicker = (
  options: PrivateDownloadFilePickerOptions
) => Promise<PrivateDownloadFileHandle>

type PrivateDownloadBrowserGlobal = typeof globalThis & {
  showSaveFilePicker?: PrivateDownloadFilePicker
}

export type ProfessionalLongFormCustomerDeliveryPrivateDownloadProgress = {
  writtenByteCount: number
  totalByteSize: number
  completionPercent: number
  completedRangeCount: number
}

export type ProfessionalLongFormCustomerDeliveryPrivateDownloadResult =
  | {
      status: 'saved'
      message: string
      retryable: false
      receipt: {
        suggestedFileName: string
        byteSize: number
        fullArtifactSha256: string
        privateDownloadDeliveryId: string
        authenticatedRangeCount: number
        maximumResidentRangeBytes: number
        publicOrSignedUrlCreated: false
        wholeArtifactBlobCreated: false
      }
    }
  | {
      status:
        | 'blocked'
        | 'cancelled'
        | 'not_supported'
        | 'unavailable'
      message: string
      retryable: boolean
    }

export function professionalLongFormCustomerDeliveryPrivateDownloadSupported(): boolean {
  return typeof (
    globalThis as PrivateDownloadBrowserGlobal
  ).showSaveFilePicker === 'function'
}

export async function saveProfessionalLongFormCustomerDeliveryPrivateDownload(
  input: {
    authority: ProfessionalLongFormCustomerDeliveryClientInput
    review: ProfessionalLongFormCustomerDeliveryBrowserReview
    onProgress?: (
      progress:
        ProfessionalLongFormCustomerDeliveryPrivateDownloadProgress
    ) => void
  },
): Promise<ProfessionalLongFormCustomerDeliveryPrivateDownloadResult> {
  const parsed = professionalLongFormCustomerDeliveryBrowserReviewSchema
    .safeParse(input.review)
  if (
    !parsed.success ||
    !reviewMatchesAuthority(parsed.data, input.authority) ||
    parsed.data.decision?.value !==
      'accept_exact_private_customer_delivery' ||
    !parsed.data.privateDownload ||
    parsed.data.readiness.authenticatedPrivateDownloadReady !== true
  ) {
    return {
      status: 'blocked',
      message:
        'Refresh the exact accepted delivery before saving its private master.',
      retryable: false,
    }
  }

  const picker = (
    globalThis as PrivateDownloadBrowserGlobal
  ).showSaveFilePicker
  if (!picker) {
    return {
      status: 'not_supported',
      message:
        'This browser cannot stream a large private master directly to a chosen file. Use current Chrome or Edge on desktop.',
      retryable: false,
    }
  }

  const suggestedFileName = buildSuggestedFileName(
    parsed.data.identity.editSessionId,
  )
  let fileHandle: PrivateDownloadFileHandle
  try {
    fileHandle = await picker({
      suggestedName: suggestedFileName,
      types: [{
        description: 'MPEG-4 video',
        accept: { 'video/mp4': ['.mp4'] },
      }],
      excludeAcceptAllOption: true,
    })
  } catch (error) {
    if (getErrorName(error) === 'AbortError') {
      return {
        status: 'cancelled',
        message: 'No file was changed.',
        retryable: true,
      }
    }
    return {
      status: 'unavailable',
      message: 'The private file destination could not be opened.',
      retryable: true,
    }
  }

  let writable: PrivateDownloadWritableFile | null = null
  try {
    writable = await fileHandle.createWritable({ keepExistingData: false })
    const totalByteSize = parsed.data.privateDownload.byteSize
    let writtenByteCount = 0
    let authenticatedRangeCount = 0
    let privateDownloadDeliveryId: string | null = null

    while (writtenByteCount < totalByteSize) {
      const start = writtenByteCount
      const end = Math.min(
        start + PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MAX_RANGE_BYTES - 1,
        totalByteSize - 1,
      )
      const result =
        await readProfessionalLongFormCustomerDeliveryDownloadRange({
          authority: input.authority,
          review: parsed.data,
          start,
          end,
        })
      if (result.status !== 'ready') {
        await abortQuietly(writable)
        return {
          status: result.status === 'unavailable'
            ? 'unavailable'
            : 'blocked',
          message: result.message,
          retryable: result.retryable,
        }
      }
      if (
        result.range.start !== start ||
        result.range.end !== end ||
        result.range.totalByteSize !== totalByteSize ||
        result.range.fullArtifactSha256 !==
          parsed.data.privateDownload.expectedMasterSha256 ||
        !result.range.privateDownloadDeliveryId ||
        (
          privateDownloadDeliveryId !== null &&
          result.range.privateDownloadDeliveryId !==
            privateDownloadDeliveryId
        )
      ) {
        await abortQuietly(writable)
        return {
          status: 'blocked',
          message:
            'The authenticated private download changed while it was being saved. Refresh the delivery before trying again.',
          retryable: false,
        }
      }

      privateDownloadDeliveryId = result.range.privateDownloadDeliveryId
      await writable.write(result.range.bytes)
      writtenByteCount += result.range.bytes.byteLength
      authenticatedRangeCount += 1
      input.onProgress?.({
        writtenByteCount,
        totalByteSize,
        completionPercent: Math.floor(
          (writtenByteCount * 100) / totalByteSize,
        ),
        completedRangeCount: authenticatedRangeCount,
      })
    }

    if (
      writtenByteCount !== totalByteSize ||
      privateDownloadDeliveryId === null
    ) {
      await abortQuietly(writable)
      return {
        status: 'blocked',
        message:
          'The authenticated private download ended before the exact master was complete.',
        retryable: false,
      }
    }

    await writable.close()
    writable = null
    return {
      status: 'saved',
      message:
        'The exact accepted private master was saved to the file you chose.',
      retryable: false,
      receipt: {
        suggestedFileName,
        byteSize: totalByteSize,
        fullArtifactSha256:
          parsed.data.privateDownload.expectedMasterSha256,
        privateDownloadDeliveryId,
        authenticatedRangeCount,
        maximumResidentRangeBytes:
          PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MAX_RANGE_BYTES,
        publicOrSignedUrlCreated: false,
        wholeArtifactBlobCreated: false,
      },
    }
  } catch {
    if (writable) await abortQuietly(writable)
    return {
      status: 'unavailable',
      message:
        'Saving the private master stopped before the file was committed. It is safe to try again.',
      retryable: true,
    }
  }
}

function buildSuggestedFileName(editSessionId: string): string {
  const safeEditName = editSessionId
    .replace(/[^A-Za-z0-9_-]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 80)
  return `ReEditPro-${safeEditName || 'accepted-edit'}-master.mp4`
}

function reviewMatchesAuthority(
  review: ProfessionalLongFormCustomerDeliveryBrowserReview,
  authority: ProfessionalLongFormCustomerDeliveryClientInput,
): boolean {
  return review.identity.workspaceId === authority.scope.workspaceId &&
    review.identity.projectId === authority.projectId &&
    review.identity.editSessionId === authority.editSessionId &&
    review.identity.approvedPlanSnapshotId ===
      authority.approvedPlanSnapshotId &&
    review.identity.packageRecordId === authority.packageRecordId
}

function getErrorName(error: unknown): string | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    typeof error.name === 'string'
  ) return error.name
  return null
}

async function abortQuietly(
  writable: PrivateDownloadWritableFile,
): Promise<void> {
  try {
    await writable.abort()
  } catch {
    // The browser owns cleanup of an uncommitted file destination.
  }
}
