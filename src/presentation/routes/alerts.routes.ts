import { Router } from 'express';
import { TokenGateway } from '../../domain/interfaces/gateways/TokenGateway';
import { AppContainer } from '../../infrastructure/container/Container';
import { AlertController } from '../controllers/AlertController';
import { AuthRequest, makeAuthGuard } from '../middleware/authGuard';

export function alertRoutes(container: AppContainer, tokens: TokenGateway): Router {
  const router = Router();
  const guard  = makeAuthGuard(tokens);
  const ctrl   = new AlertController(
    container.alertListing,
    container.alertCreation,
    container.alertRemoval,
  );

  router.get('/',       guard, (req, res, next) => ctrl.list(req as AuthRequest, res, next));
  router.post('/',      guard, (req, res, next) => ctrl.create(req as AuthRequest, res, next));
  router.delete('/:id', guard, (req, res, next) => ctrl.remove(req as AuthRequest, res, next));

  return router;
}
