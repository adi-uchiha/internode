export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errorCode: string = 'internal_server_error'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad Request', errorCode: string = 'bad_request') {
    super(message, 400, errorCode);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', errorCode: string = 'unauthorized') {
    super(message, 401, errorCode);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', errorCode: string = 'forbidden') {
    super(message, 403, errorCode);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Not Found', errorCode: string = 'not_found') {
    super(message, 404, errorCode);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string = 'Validation Error',
    public errors?: unknown
  ) {
    super(message, 422, 'validation_error');
    this.name = 'ValidationError';
  }
}
