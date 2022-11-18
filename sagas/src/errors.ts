class AppError<D = unknown, M = unknown> extends Error {
  private _data: D
  private _metadata: M

  constructor(message?: string, data?: D, metadata?: M) {
    super(message)
    this._data = data
    this._metadata = metadata
  }

  get data() {
    return this._data
  }

  get metadata() {
    return this._metadata
  }
}

export class ConflictError extends AppError {}
export class TimeoutError extends AppError {}
export class InvalidSagaMessageError extends AppError {}
export class InvalidSagaStateError extends AppError {}
export class InvalidSagaStateUpdateError extends AppError {}
