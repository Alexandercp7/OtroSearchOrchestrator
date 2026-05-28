import { TokenGateway } from '../../domain/interfaces/gateways/TokenGateway';
import { Store } from '../../domain/interfaces/stores/Store';
import { AlertCreation } from '../../domain/usecases/AlertCreation';
import { AlertListing } from '../../domain/usecases/AlertListing';
import { AlertRemoval } from '../../domain/usecases/AlertRemoval';
import { ProductSearch } from '../../domain/usecases/ProductSearch';
import { TokenRefresh } from '../../domain/usecases/TokenRefresh';
import { UpdateUserPreferences } from '../../domain/usecases/UpdateUserPreferences';
import { UserLogin } from '../../domain/usecases/UserLogin';
import { UserRegistration } from '../../domain/usecases/UserRegistration';
import { WatchlistAddition } from '../../domain/usecases/WatchlistAddition';
import { WatchlistRemoval } from '../../domain/usecases/WatchlistRemoval';
import { WatchlistView } from '../../domain/usecases/WatchlistView';
import { InMemorySearchCache } from '../cache/InMemorySearchCache';
import { UuidGenerator } from '../identity/UuidGenerator';
import { RegexNormalizer } from '../normalizer/RegexNormalizer';
import { SmtpNotificationGateway } from '../notifications/SmtpNotificationGateway';
import { MysqlAlertRepository } from '../persistence/mysql/MysqlAlertRepository';
import { MysqlPriceHistoryRepository } from '../persistence/mysql/MysqlPriceHistoryRepository';
import { MysqlUserRepository } from '../persistence/mysql/MysqlUserRepository';
import { MysqlWatchlistRepository } from '../persistence/mysql/MysqlWatchlistRepository';
import { getConnection } from '../persistence/mysql/connection';
import { WeightedRankStrategy } from '../ranking/WeightedRankStrategy';
import { BcryptPasswordGateway } from '../security/BcryptPasswordGateway';
import { JwtTokenGateway } from '../security/JwtTokenGateway';
import { AmazonMxStore } from '../stores/AmazonMxStore';
import { MercadoLibreStore } from '../stores/MercadoLibreStore';

export interface AppContainer {
  tokenGateway:           TokenGateway;
  userLogin:              UserLogin;
  userRegistration:       UserRegistration;
  tokenRefresh:           TokenRefresh;
  updateUserPreferences:  UpdateUserPreferences;
  productSearch:          ProductSearch;
  watchlistAddition:      WatchlistAddition;
  watchlistView:          WatchlistView;
  watchlistRemoval:       WatchlistRemoval;
  alertCreation:          AlertCreation;
  alertListing:           AlertListing;
  alertRemoval:           AlertRemoval;
}

export function buildContainer(): AppContainer {
  const db = getConnection();

  const userRepo      = new MysqlUserRepository(db);
  const alertRepo     = new MysqlAlertRepository(db);
  const watchlistRepo = new MysqlWatchlistRepository(db);
  const historyRepo   = new MysqlPriceHistoryRepository(db);

  const passwordGw = new BcryptPasswordGateway();
  const tokenGw    = new JwtTokenGateway(
    process.env.JWT_SECRET!,
    process.env.JWT_REFRESH_SECRET!,
  );
  const idGen = new UuidGenerator();

  const normalizer = new RegexNormalizer(idGen);
  const ranker     = new WeightedRankStrategy();
  const cache      = new InMemorySearchCache();

  const mlStore  = new MercadoLibreStore();
  const amzStore = new AmazonMxStore();
  const storeList: Store[] = [mlStore, amzStore];
  const storeMap  = new Map<string, Store>([
    [mlStore.name,  mlStore],
    [amzStore.name, amzStore],
  ]);

  return {
    tokenGateway:          tokenGw,
    userLogin:             new UserLogin(userRepo, passwordGw, tokenGw),
    userRegistration:      new UserRegistration(userRepo, passwordGw, tokenGw, idGen),
    tokenRefresh:          new TokenRefresh(tokenGw),
    updateUserPreferences: new UpdateUserPreferences(userRepo),
    productSearch:         new ProductSearch(storeList, normalizer, ranker, cache),
    watchlistAddition:     new WatchlistAddition(watchlistRepo, historyRepo, storeMap, normalizer, idGen),
    watchlistView:         new WatchlistView(watchlistRepo, historyRepo),
    watchlistRemoval:      new WatchlistRemoval(watchlistRepo),
    alertCreation:         new AlertCreation(alertRepo, idGen),
    alertListing:          new AlertListing(alertRepo),
    alertRemoval:          new AlertRemoval(alertRepo),
  };
}
