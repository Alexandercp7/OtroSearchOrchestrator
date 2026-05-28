import { Router } from 'express';
import { TokenGateway } from '../../domain/interfaces/gateways/TokenGateway';
import { AppContainer } from '../../infrastructure/container/Container';
import { SearchController } from '../controllers/SearchController';
import { makeAuthGuard } from '../middleware/authGuard';

export function searchRoutes(container: AppContainer, tokens: TokenGateway): Router {
  const router = Router();
  const guard  = makeAuthGuard(tokens);
  const ctrl   = new SearchController(container.productSearch);

  router.get('/', guard, (req, res, next) => ctrl.search(req, res, next));

  return router;
}
