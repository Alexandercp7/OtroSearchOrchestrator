import { Router } from 'express';
import { TokenGateway } from '../../domain/interfaces/gateways/TokenGateway';
import { SearchWeights } from '../../domain/valueObjects/SearchWeights';
import { AppContainer } from '../../infrastructure/container/Container';
import { AuthRequest, makeAuthGuard } from '../middleware/authGuard';

export function searchRoutes(container: AppContainer, tokens: TokenGateway): Router {
  const router = Router();
  const guard  = makeAuthGuard(tokens);

  router.get('/', guard, async (req, res, next) => {
    try {
      const { query, price, stock, delivery, msi } = req.query as Record<string, string>;
      const weights = new SearchWeights(
        Number(price    ?? 0.25),
        Number(stock    ?? 0.25),
        Number(delivery ?? 0.25),
        Number(msi      ?? 0.25),
      );
      const result = await container.productSearch.search({ query, weights });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
