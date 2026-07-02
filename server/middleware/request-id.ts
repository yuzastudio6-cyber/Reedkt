import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import type { RuntimeRequest } from '../types'

export function requestIdMiddleware(request: Request, response: Response, next: NextFunction): void {
  const requestId = request.header('x-request-id') ?? randomUUID()
  const runtimeRequest = request as RuntimeRequest
  runtimeRequest.context = {
    ...(runtimeRequest.context ?? {}),
    requestId,
  }
  response.setHeader('x-request-id', requestId)
  next()
}
