import { Router } from 'express';
import { AppContainer } from '../../infrastructure/container/Container';
import { AuthController } from '../controllers/AuthController';

export function authRoutes(container: AppContainer): Router {
  const router = Router();
  const ctrl = new AuthController(
    container.userRegistration,
    container.userLogin,
    container.tokenRefresh,
  );

  router.post('/register', (req, res, next) => ctrl.register(req, res, next));
  router.post('/login',    (req, res, next) => ctrl.login(req, res, next));
  router.post('/refresh',  (req, res, next) => ctrl.refresh(req, res, next));

  return router;
}
