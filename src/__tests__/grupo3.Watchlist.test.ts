import { WatchlistItem } from '../domain/entities/WatchlistItem';
import { PriceSnapshot } from '../domain/entities/PriceSnapshot';
import { WatchlistAddition } from '../domain/usecases/WatchlistAddition';
import { WatchlistRemoval } from '../domain/usecases/WatchlistRemoval';
import { WatchlistView } from '../domain/usecases/WatchlistView';
import { Money } from '../domain/valueObjects/Money';
import { Product } from '../domain/entities/Product';
import { InvalidProductUrl } from '../domain/exceptions/SearchErrors';
import { ItemAlreadyTracked, WatchlistItemNotFound, UnknownStore } from '../domain/exceptions/WatchlistErrors';
import { ProductNotFound } from '../domain/exceptions/SearchErrors';
import { RawProduct } from '../domain/dtos/search/RawProduct';
import { DateRange } from '../domain/valueObjects/DateRange';

const price = new Money(1000, 'MXN');
const productUrl = 'https://amazon.com/monitor';

class FakeIdGenerator {
  private count = 0;
  generate(): string { return `id-${++this.count}`; }
}

// Fakes
class FakeWatchlistRepo {
  saved: WatchlistItem[] = [];
  removed: string[] = [];
  private items: WatchlistItem[];

  constructor(initial: WatchlistItem[] = []) {
    this.items = [...initial];
  }

  async exists(userId: string, productUrl: string): Promise<boolean> {
    return this.items.some(i => i.userId === userId && i.productUrl === productUrl);
  }

  async save(item: WatchlistItem): Promise<void> {
    this.saved.push(item);
    this.items.push(item);
  }

  async findById(id: string): Promise<WatchlistItem | null> {
    return this.items.find(i => i.id === id) ?? null;
  }

  async findByUserId(userId: string): Promise<WatchlistItem[]> {
    return this.items.filter(i => i.userId === userId);
  }

  async findAll(): Promise<WatchlistItem[]> {
    return [...this.items];
  }

  async remove(id: string): Promise<void> {
    this.removed.push(id);
    this.items = this.items.filter(i => i.id !== id);
  }
}

class FakeHistoryRepo {
  saved: PriceSnapshot[] = [];
  private latestMap: Map<string, PriceSnapshot>;

  constructor(latestMap: Map<string, PriceSnapshot> = new Map()) {
    this.latestMap = latestMap;
  }

  async saveSnapshot(snapshot: PriceSnapshot): Promise<void> {
    this.saved.push(snapshot);
  }

  async getLatest(productUrl: string): Promise<PriceSnapshot | null> {
    return this.latestMap.get(productUrl) ?? null;
  }

  async getHistory(productUrl: string, range: DateRange): Promise<PriceSnapshot[]> {
    return [];
  }

  async getMin(productUrl: string, range: DateRange): Promise<Money | null> {
    return null;
  }

  async getMax(productUrl: string, range: DateRange): Promise<Money | null> {
    return null;
  }
}

class FakeStore {
  readonly name: string;
  private raw: RawProduct | null;

  constructor(name: string, raw: RawProduct | null) {
    this.name = name;
    this.raw = raw;
  }

  async fetchOne(_url: string): Promise<RawProduct | null> {
    return this.raw;
  }
}

class FakeNormalizer {
  normalize(raw: RawProduct): Product {
    return new Product('p1', raw.title, price, raw.store, raw.url, true, 3, 0);
  }
}

function makeRaw(): RawProduct {
  return {
    title: 'Test Monitor',
    priceText: '1000',
    currency: 'MXN',
    store: 'amazon',
    url: productUrl,
    inStockText: 'In Stock',
    deliveryText: '3 days',
    msiText: '0',
  };
}

describe('Grupo 3 — WatchlistItem', () => {
  it('creates with all fields', () => {
    const addedAt = new Date();
    const item = new WatchlistItem('i1', 'u1', productUrl, 'amazon', 'Monitor', addedAt);
    expect(item.id).toBe('i1');
    expect(item.userId).toBe('u1');
    expect(item.productUrl).toBe(productUrl);
    expect(item.store).toBe('amazon');
    expect(item.title).toBe('Monitor');
    expect(item.addedAt).toBe(addedAt);
  });

  it('empty productUrl throws InvalidProductUrl', () => {
    expect(() => new WatchlistItem('i1', 'u1', '', 'amazon', 'Monitor', new Date())).toThrow(InvalidProductUrl);
  });
});

describe('Grupo 3 — PriceSnapshot', () => {
  it('creates with all fields', () => {
    const scrapedAt = new Date();
    const snap = new PriceSnapshot('s1', productUrl, 'amazon', price, scrapedAt);
    expect(snap.id).toBe('s1');
    expect(snap.productUrl).toBe(productUrl);
    expect(snap.store).toBe('amazon');
    expect(snap.price).toBe(price);
    expect(snap.scrapedAt).toBe(scrapedAt);
  });

  it('empty productUrl throws InvalidProductUrl', () => {
    expect(() => new PriceSnapshot('s1', '', 'amazon', price, new Date())).toThrow(InvalidProductUrl);
  });
});

describe('Grupo 3 — WatchlistAddition', () => {
  it('adds item with correct title and store, saves price snapshot', async () => {
    const repo = new FakeWatchlistRepo();
    const history = new FakeHistoryRepo();
    const storeMap = new Map([['amazon', new FakeStore('amazon', makeRaw())]]);
    const uc = new WatchlistAddition(repo, history, storeMap, new FakeNormalizer(), new FakeIdGenerator());

    const item = await uc.add({ userId: 'u1', productUrl, store: 'amazon' });
    expect(item.title).toBe('Test Monitor');
    expect(item.store).toBe('amazon');
    expect(history.saved.length).toBe(1);
    expect(history.saved[0]!.price.amount.toNumber()).toBe(1000);
  });

  it('second call with same userId+url throws ItemAlreadyTracked', async () => {
    const repo = new FakeWatchlistRepo();
    const history = new FakeHistoryRepo();
    const storeMap = new Map([['amazon', new FakeStore('amazon', makeRaw())]]);
    const uc = new WatchlistAddition(repo, history, storeMap, new FakeNormalizer(), new FakeIdGenerator());

    await uc.add({ userId: 'u1', productUrl, store: 'amazon' });
    await expect(uc.add({ userId: 'u1', productUrl, store: 'amazon' })).rejects.toThrow(ItemAlreadyTracked);
  });

  it('unknown store throws UnknownStore', async () => {
    const repo = new FakeWatchlistRepo();
    const history = new FakeHistoryRepo();
    const storeMap = new Map<string, FakeStore>();
    const uc = new WatchlistAddition(repo, history, storeMap, new FakeNormalizer(), new FakeIdGenerator());
    await expect(uc.add({ userId: 'u1', productUrl, store: 'unknown' })).rejects.toThrow(UnknownStore);
  });

  it('store returns null throws ProductNotFound', async () => {
    const repo = new FakeWatchlistRepo();
    const history = new FakeHistoryRepo();
    const storeMap = new Map([['amazon', new FakeStore('amazon', null)]]);
    const uc = new WatchlistAddition(repo, history, storeMap, new FakeNormalizer(), new FakeIdGenerator());
    await expect(uc.add({ userId: 'u1', productUrl, store: 'amazon' })).rejects.toThrow(ProductNotFound);
  });
});

describe('Grupo 3 — WatchlistRemoval', () => {
  it('removes an existing item', async () => {
    const item = new WatchlistItem('i1', 'u1', productUrl, 'amazon', 'Monitor', new Date());
    const repo = new FakeWatchlistRepo([item]);
    const uc = new WatchlistRemoval(repo);
    await uc.remove('i1');
    expect(repo.removed).toContain('i1');
  });

  it('non-existent id throws WatchlistItemNotFound', async () => {
    const repo = new FakeWatchlistRepo();
    const uc = new WatchlistRemoval(repo);
    await expect(uc.remove('nonexistent')).rejects.toThrow(WatchlistItemNotFound);
  });
});

describe('Grupo 3 — WatchlistView', () => {
  it('lists items with currentPrice from history', async () => {
    const addedAt = new Date();
    const item = new WatchlistItem('i1', 'user-1', productUrl, 'amazon', 'Monitor', addedAt);
    const snap = new PriceSnapshot('s1', productUrl, 'amazon', price, new Date());
    const watchlistRepo = new FakeWatchlistRepo([item]);
    const historyRepo = new FakeHistoryRepo(new Map([[productUrl, snap]]));
    const uc = new WatchlistView(watchlistRepo, historyRepo);

    const result = await uc.list('user-1');
    expect(result.length).toBe(1);
    expect(result[0]!.currentPrice!.equals(price)).toBe(true);
    expect(result[0]!.id).toBe('i1');
    expect(result[0]!.productUrl).toBe(productUrl);
    expect(result[0]!.store).toBe('amazon');
    expect(result[0]!.title).toBe('Monitor');
    expect(result[0]!.addedAt).toBe(addedAt);
  });

  it('no snapshot means currentPrice is null', async () => {
    const item = new WatchlistItem('i1', 'user-1', productUrl, 'amazon', 'Monitor', new Date());
    const watchlistRepo = new FakeWatchlistRepo([item]);
    const historyRepo = new FakeHistoryRepo();
    const uc = new WatchlistView(watchlistRepo, historyRepo);

    const result = await uc.list('user-1');
    expect(result[0]!.currentPrice).toBeNull();
  });

  it('no items returns empty array', async () => {
    const watchlistRepo = new FakeWatchlistRepo();
    const historyRepo = new FakeHistoryRepo();
    const uc = new WatchlistView(watchlistRepo, historyRepo);
    const result = await uc.list('user-1');
    expect(result.length).toBe(0);
  });
});
