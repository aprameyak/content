import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { unprocessable } from '../utils/response';

type Target = 'body' | 'params' | 'query';

export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      unprocessable(
        res,
        'Validation failed',
        (result.error as ZodError).errors,
      );
      return;
    }
    req[target] = result.data;
    next();
  };
}
