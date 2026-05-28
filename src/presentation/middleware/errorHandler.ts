import { NextFunction, Request, Response } from 'express';
import { DomainError } from '../../domain/exceptions/DomainError';
import {
  InvalidCredentials,
  InvalidToken,
  UserAlreadyExists,
  UserNotFound,
} from '../../domain/exceptions/UserErrors';
import { AllStoresFailed, ProductNotFound } from '../../domain/exceptions/SearchErrors';
import { ItemAlreadyTracked, WatchlistItemNotFound } from '../../domain/exceptions/WatchlistErrors';
import { AlertNotFound } from '../../domain/exceptions/AlertErrors';

const STATUS_MAP = new Map<string, number>([
  [InvalidCredentials.name,   401],
  [InvalidToken.name,         401],
  [UserAlreadyExists.name,    409],
  [UserNotFound.name,         404],
  [ProductNotFound.name,      404],
  [WatchlistItemNotFound.name, 404],
  [AlertNotFound.name,        404],
  [ItemAlreadyTracked.name,   409],
  [AllStoresFailed.name,      503],
]);

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof DomainError) {
    const status = STATUS_MAP.get(err.name) ?? 400;
    res.status(status).json({ error: err.code, message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
}
