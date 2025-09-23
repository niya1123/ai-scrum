export type ErrorBody = {
  code: string
  message: string
  details?: Record<string, unknown>
}

export function notFound(message = 'Resource not found', details?: Record<string, unknown>): ErrorBody {
  return { code: 'NOT_FOUND', message, ...(details ? { details } : {}) }
}

export function invalidId(message = 'Invalid id', details?: Record<string, unknown>): ErrorBody {
  return { code: 'INVALID_ID', message, ...(details ? { details } : {}) }
}
