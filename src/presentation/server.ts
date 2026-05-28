import express from 'express';
import { buildContainer } from '../infrastructure/container/Container';
import { errorHandler } from './middleware/errorHandler';
import { alertRoutes } from './routes/alerts.routes';
import { authRoutes } from './routes/auth.routes';
import { searchRoutes } from './routes/search.routes';
import { watchlistRoutes } from './routes/watchlist.routes';

export function createServer() {
  const app       = express();
  const container = buildContainer();
  const tokens    = container.tokenGateway;

  app.use(express.json());

  app.use('/auth',      authRoutes(container));
  app.use('/search',    searchRoutes(container, tokens));
  app.use('/watchlist', watchlistRoutes(container, tokens));
  app.use('/alerts',    alertRoutes(container, tokens));

  app.use(errorHandler);

  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT ?? 3000);
  createServer().listen(port, () => console.log(`Server running on port ${port}`));
}
