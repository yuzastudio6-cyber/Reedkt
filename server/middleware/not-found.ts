import type { RequestHandler } from 'express'
import { ApiError } from '../errors/api-error'

export const notFoundMiddleware: RequestHandler = (request, _response, next) => {
  next(new ApiError('ROUTE_NOT_FOUND', `No API route is registered for ${request.method} ${request.path}.`, 404))
}
