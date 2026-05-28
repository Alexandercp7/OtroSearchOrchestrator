import { Router } from 'express';
import { AppContainer } from '../../infrastructure/container/Container';

export function authRoutes(container: AppContainer): Router {
  const router = Router();

  router.post('/register', async (req, res, next) => {
    try {
      const result = await container.userRegistration.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      const result = await container.userLogin.login(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/refresh', async (req, res, next) => {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const result = await container.tokenRefresh.refresh(refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
