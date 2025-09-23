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

export function invalidPosition(message = 'Invalid position', details?: Record<string, unknown>): ErrorBody {
  return { code: 'INVALID_POSITION', message, ...(details ? { details } : {}) }
}

export function cellOccupied(message = 'Cell is already occupied', details?: Record<string, unknown>): ErrorBody {
  return { code: 'CELL_OCCUPIED', message, ...(details ? { details } : {}) }
}

export function outOfTurn(message = 'Out of turn', details?: Record<string, unknown>): ErrorBody {
  return { code: 'OUT_OF_TURN', message, ...(details ? { details } : {}) }
}

export function gameOver(message = 'Game is over', details?: Record<string, unknown>): ErrorBody {
  return { code: 'GAME_OVER', message, ...(details ? { details } : {}) }
}

export function obsNotAllowed(message = 'Observation not allowed', details?: Record<string, unknown>): ErrorBody {
  return { code: 'OBS_NOT_ALLOWED', message, ...(details ? { details } : {}) }
}

export function obsLimitExceeded(message = 'Observation limit exceeded', details?: Record<string, unknown>): ErrorBody {
  return { code: 'OBS_LIMIT_EXCEEDED', message, ...(details ? { details } : {}) }
}

export class DomainException extends Error {
  constructor(public readonly body: ErrorBody, public readonly status = 400) {
    super(body.message)
    this.name = 'DomainException'
  }
}
