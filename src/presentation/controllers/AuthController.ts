import { NextFunction, Request, Response } from 'express';
import { TokenRefresh } from '../../domain/usecases/TokenRefresh';
import { UserLogin } from '../../domain/usecases/UserLogin';
import { UserRegistration } from '../../domain/usecases/UserRegistration';

export class AuthController {
  constructor(
    private readonly registration: UserRegistration,
    private readonly userLogin: UserLogin,
    private readonly tokenRefresh: TokenRefresh,
  ) {}

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.registration.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.userLogin.login(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const result = await this.tokenRefresh.refresh(refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
