import { Router } from 'express';
import { TokenGateway } from '../../domain/interfaces/gateways/TokenGateway';
import { AppContainer } from '../../infrastructure/container/Container';
import { AuthRequest, makeAuthGuard } from '../middleware/authGuard';

export function alertRoutes(container: AppContainer, tokens: TokenGateway): Router {
  const router = Router();
  const guard  = makeAuthGuard(tokens);

  router.get('/', guard, async (req, res, next) => {
    try {
      const { userId } = req as AuthRequest;
      const alerts = await container.alertListing.list(userId);
      res.json(alerts);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', guard, async (req, res, next) => {
    try {
      const { userId } = req as AuthRequest;
      const alert = await container.alertCreation.create({ ...req.body, userID: userId });
      res.status(201).json(alert);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', guard, async (req, res, next) => {
    try {
      await container.alertRemoval.remove(req.params['id']!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
