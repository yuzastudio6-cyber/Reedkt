import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import type { RuntimeRequest } from '../types'

export function requestIdMiddleware(request: Request, response: Response, next: NextFunction): void {
  const suppliedRequestId = request.header('x-request-id')?.trim()
  const requestId = suppliedRequestId && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(suppliedRequestId)
    ? suppliedRequestId
    : randomUUID()
  const runtimeRequest = request as RuntimeRequest
  runtimeRequest.context = {
    ...(runtimeRequest.context ?? {}),
    requestId,
  }
  response.setHeader('x-request-id', requestId)
  next()
}
