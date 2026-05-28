import { Router } from 'express';
import { TokenGateway } from '../../domain/interfaces/gateways/TokenGateway';
import { AppContainer } from '../../infrastructure/container/Container';
import { WatchlistController } from '../controllers/WatchlistController';
import { AuthRequest, makeAuthGuard } from '../middleware/authGuard';

export function watchlistRoutes(container: AppContainer, tokens: TokenGateway): Router {
  const router = Router();
  const guard  = makeAuthGuard(tokens);
  const ctrl   = new WatchlistController(
    container.watchlistView,
    container.watchlistAddition,
    container.watchlistRemoval,
  );

  router.get('/',    guard, (req, res, next) => ctrl.list(req as AuthRequest, res, next));
  router.post('/',   guard, (req, res, next) => ctrl.add(req as AuthRequest, res, next));
  router.delete('/:id', guard, (req, res, next) => ctrl.remove(req as AuthRequest, res, next));

  return router;
}
