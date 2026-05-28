import { DateRange, InvalidDateRange } from '../domain/valueObjects/DateRange';
import { PriceHistoryQuery } from '../domain/usecases/PriceHistoryQuery';
import { PriceRefresh } from '../domain/usecases/PriceRefresh';
import { PriceSnapshot } from '../domain/entities/PriceSnapshot';
import { WatchlistItem } from '../domain/entities/WatchlistItem';
import { Money } from '../domain/valueObjects/Money';
import { Product } from '../domain/entities/Product';
import { DomainError } from '../domain/exceptions/DomainError';
import { RawProduct } from '../domain/dtos/search/RawProduct';

const productUrl = 'https://amazon.com/monitor';
const price = new Money(800, 'MXN');

class FakeHistoryRepo {
  saved: PriceSnapshot[] = [];
  private snapshots: PriceSnapshot[];

  constructor(snapshots: PriceSnapshot[] = []) {
    this.snapshots = [...snapshots];
  }

  async saveSnapshot(snap: PriceSnapshot): Promise<void> {
    this.saved.push(snap);
    this.snapshots.push(snap);
  }

  async getLatest(_url: string): Promise<PriceSnapshot | null> {
    return null;
  }

  async getHistory(_url: string, _range: DateRange): Promise<PriceSnapshot[]> {
    return [...this.snapshots];
  }

  async getMin(_url: string, _range: DateRange): Promise<Money | null> {
    return null;
  }
}

class FakeWatchlistRepo {
  private items: WatchlistItem[];

  constructor(items: WatchlistItem[] = []) {
    this.items = [...items];
  }

  async findAll(): Promise<WatchlistItem[]> {
    return [...this.items];
  }

  async findById(_id: string): Promise<WatchlistItem | null> { return null; }
  async findByUser(_userId: string): Promise<WatchlistItem[]> { return []; }
  async exists(_userId: string, _productUrl: string): Promise<boolean> { return false; }
  async save(_item: WatchlistItem): Promise<void> {}
  async remove(_id: string): Promise<void> {}
}

class FakeStore {
  readonly name: string;
  private raw: RawProduct | null;
  private shouldThrow: boolean;

  constructor(name: string, raw: RawProduct | null, shouldThrow = false) {
    this.name = name;
    this.raw = raw;
    this.shouldThrow = shouldThrow;
  }

  async fetchOne(_url: string): Promise<RawProduct | null> {
    if (this.shouldThrow) throw new Error('Store failed');
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
    title: 'Monitor',
    priceText: '800',
    currency: 'MXN',
    store: 'amazon',
    url: productUrl,
    inStockText: 'In Stock',
    deliveryText: '3 days',
    msiText: '0',
  };
}

describe('Grupo 5 — DateRange', () => {
  it('from before to is valid', () => {
    const from = new Date('2024-01-01');
    const to = new Date('2024-01-31');
    expect(() => new DateRange(from, to)).not.toThrow();
  });

  it('from === to is valid (point in time)', () => {
    const d = new Date('2024-01-01');
    expect(() => new DateRange(d, d)).not.toThrow();
  });

  it('from after to throws InvalidDateRange', () => {
    const from = new Date('2024-01-31');
    const to = new Date('2024-01-01');
    expect(() => new DateRange(from, to)).toThrow(InvalidDateRange);
  });

  it('contains() is inclusive on both boundaries', () => {
    const from = new Date('2024-01-01');
    const to = new Date('2024-01-31');
    const range = new DateRange(from, to);
    expect(range.contains(from)).toBe(true);
    expect(range.contains(to)).toBe(true);
    expect(range.contains(new Date('2024-01-15'))).toBe(true);
    expect(range.contains(new Date('2023-12-31'))).toBe(false);
    expect(range.contains(new Date('2024-02-01'))).toBe(false);
  });

  it('DateRange.lastDays(n) returns range spanning approximately N days', () => {
    const range = DateRange.lastDays(7);
    const expectedSpan = 7 * 24 * 60 * 60 * 1000;
    const actualSpan = range.to.getTime() - range.from.getTime();
    // Allow 1 second tolerance
    expect(Math.abs(actualSpan - expectedSpan)).toBeLessThan(1000);
  });

  it('InvalidDateRange extends DomainError', () => {
    expect(new InvalidDateRange('test')).toBeInstanceOf(DomainError);
  });
});

describe('Grupo 5 — PriceHistoryQuery', () => {
  it('maps snapshots to price points', async () => {
    const scrapedAt = new Date();
    const snap = new PriceSnapshot('s1', productUrl, 'amazon', price, scrapedAt);
    const history = new FakeHistoryRepo([snap]);
    const uc = new PriceHistoryQuery(history);
    const range = DateRange.lastDays(7);
    const result = await uc.query({ productUrl, range });
    expect(result.length).toBe(1);
    expect(result[0]!.timestamp).toBe(scrapedAt);
    expect(result[0]!.price).toBe(price);
  });

  it('returns empty array for no snapshots', async () => {
    const history = new FakeHistoryRepo();
    const uc = new PriceHistoryQuery(history);
    const range = DateRange.lastDays(7);
    const result = await uc.query({ productUrl, range });
    expect(result.length).toBe(0);
  });

  it('preserves order of snapshots', async () => {
    const snap1 = new PriceSnapshot('s1', productUrl, 'amazon', new Money(1000, 'MXN'), new Date('2024-01-01'));
    const snap2 = new PriceSnapshot('s2', productUrl, 'amazon', new Money(900, 'MXN'), new Date('2024-01-02'));
    const history = new FakeHistoryRepo([snap1, snap2]);
    const uc = new PriceHistoryQuery(history);
    const range = DateRange.lastDays(7);
    const result = await uc.query({ productUrl, range });
    expect(result[0]!.price.amount.toNumber()).toBe(1000);
    expect(result[1]!.price.amount.toNumber()).toBe(900);
  });
});

describe('Grupo 5 — PriceRefresh', () => {
  it('refresh saves a snapshot with updated price', async () => {
    const item = new WatchlistItem('i1', 'u1', productUrl, 'amazon', 'Monitor', new Date());
    const watchlist = new FakeWatchlistRepo([item]);
    const history = new FakeHistoryRepo();
    const storeMap = new Map([['amazon', new FakeStore('amazon', makeRaw())]]);
    const uc = new PriceRefresh(watchlist, history, storeMap, new FakeNormalizer());
    await uc.refresh();
    expect(history.saved.length).toBe(1);
    expect(history.saved[0]!.price.amount.toNumber()).toBe(800);
  });

  it('unknown store does not save snapshot', async () => {
    const item = new WatchlistItem('i1', 'u1', productUrl, 'unknown', 'Monitor', new Date());
    const watchlist = new FakeWatchlistRepo([item]);
    const history = new FakeHistoryRepo();
    const storeMap = new Map<string, FakeStore>();
    const uc = new PriceRefresh(watchlist, history, storeMap, new FakeNormalizer());
    await uc.refresh();
    expect(history.saved.length).toBe(0);
  });

  it('store returns null does not save snapshot', async () => {
    const item = new WatchlistItem('i1', 'u1', productUrl, 'amazon', 'Monitor', new Date());
    const watchlist = new FakeWatchlistRepo([item]);
    const history = new FakeHistoryRepo();
    const storeMap = new Map([['amazon', new FakeStore('amazon', null)]]);
    const uc = new PriceRefresh(watchlist, history, storeMap, new FakeNormalizer());
    await uc.refresh();
    expect(history.saved.length).toBe(0);
  });

  it('one item throws but continues and does not throw from refresh()', async () => {
    const item1 = new WatchlistItem('i1', 'u1', productUrl, 'amazon', 'Monitor', new Date());
    const item2 = new WatchlistItem('i2', 'u1', productUrl, 'failing', 'Monitor', new Date());
    const watchlist = new FakeWatchlistRepo([item1, item2]);
    const history = new FakeHistoryRepo();
    const storeMap = new Map<string, FakeStore>([
      ['amazon', new FakeStore('amazon', makeRaw())],
      ['failing', new FakeStore('failing', null, true)],
    ]);
    const uc = new PriceRefresh(watchlist, history, storeMap, new FakeNormalizer());
    await expect(uc.refresh()).resolves.not.toThrow();
    expect(history.saved.length).toBe(1);
  });
});
