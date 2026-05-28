import { NextFunction, Response } from 'express';
import { AlertCreation } from '../../domain/usecases/AlertCreation';
import { AlertListing } from '../../domain/usecases/AlertListing';
import { AlertRemoval } from '../../domain/usecases/AlertRemoval';
import { AuthRequest } from '../middleware/authGuard';

export class AlertController {
  constructor(
    private readonly listing: AlertListing,
    private readonly creation: AlertCreation,
    private readonly removal: AlertRemoval,
  ) {}

  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const alerts = await this.listing.list(req.userId);
      res.json(alerts);
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const alert = await this.creation.create({ ...req.body, userID: req.userId });
      res.status(201).json(alert);
    } catch (err) {
      next(err);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.removal.remove(req.params['id'] as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
