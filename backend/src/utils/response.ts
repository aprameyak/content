import { Response } from 'express';
import { ApiSuccess, ApiError } from '../types';

export function ok<T>(res: Response, data: T, meta?: Record<string, unknown>, status = 200): void {
  const body: ApiSuccess<T> = { success: true, data };
  if (meta) body.meta = meta;
  res.status(status).json(body);
}

export function created<T>(res: Response, data: T): void {
  ok(res, data, undefined, 201);
}

export function noContent(res: Response): void {
  res.status(204).end();
}

export function fail(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  const body: ApiError = { success: false, error: { code, message } };
  if (details !== undefined) body.error.details = details;
  res.status(status).json(body);
}

export function badRequest(res: Response, message: string, details?: unknown): void {
  fail(res, 400, 'BAD_REQUEST', message, details);
}

export function unauthorized(res: Response, message = 'Unauthorized'): void {
  fail(res, 401, 'UNAUTHORIZED', message);
}

export function forbidden(res: Response, message = 'Forbidden'): void {
  fail(res, 403, 'FORBIDDEN', message);
}

export function notFound(res: Response, message = 'Not found'): void {
  fail(res, 404, 'NOT_FOUND', message);
}

export function conflict(res: Response, message: string): void {
  fail(res, 409, 'CONFLICT', message);
}

export function unprocessable(res: Response, message: string, details?: unknown): void {
  fail(res, 422, 'UNPROCESSABLE', message, details);
}

export function tooManyRequests(res: Response, message = 'Too many requests'): void {
  fail(res, 429, 'TOO_MANY_REQUESTS', message);
}

export function serverError(res: Response, message = 'Internal server error'): void {
  fail(res, 500, 'INTERNAL_ERROR', message);
}
