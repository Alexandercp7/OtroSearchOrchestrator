import { NextFunction, Response } from 'express';
import { WatchlistAddition } from '../../domain/usecases/WatchlistAddition';
import { WatchlistRemoval } from '../../domain/usecases/WatchlistRemoval';
import { WatchlistView } from '../../domain/usecases/WatchlistView';
import { AuthRequest } from '../middleware/authGuard';

export class WatchlistController {
  constructor(
    private readonly view: WatchlistView,
    private readonly addition: WatchlistAddition,
    private readonly removal: WatchlistRemoval,
  ) {}

  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await this.view.list(req.userId);
      res.json(items);
    } catch (err) {
      next(err);
    }
  }

  async add(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await this.addition.add({ ...req.body, userId: req.userId });
      res.status(201).json(item);
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
