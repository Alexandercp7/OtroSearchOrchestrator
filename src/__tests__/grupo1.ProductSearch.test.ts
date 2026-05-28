import { ProductSearch } from '../domain/usecases/ProductSearch';
import { SearchWeights } from '../domain/valueObjects/SearchWeights';
import { Money } from '../domain/valueObjects/Money';
import { Product } from '../domain/entities/Product';
import { RankedProduct } from '../domain/dtos/search/RankedProduct';
import { AllStoresFailed } from '../domain/exceptions/SearchErrors';
import { RawProduct } from '../domain/dtos/search/RawProduct';
import { SearchResponse } from '../domain/dtos/search/SearchResponse';

const weights = SearchWeights.balanced();
const price = new Money(100, 'MXN');

function makeRaw(title: string): RawProduct {
  return {
    title,
    priceText: '100',
    currency: 'MXN',
    store: 'amazon',
    url: 'https://amazon.com/p',
    inStockText: 'In Stock',
    deliveryText: '3 days',
    msiText: '0',
  };
}

function makeProduct(title: string): Product {
  return new Product('p1', title, price, 'amazon', 'https://amazon.com/p', true, 3, 0);
}

function makeRanked(title: string, score: number): RankedProduct {
  return new RankedProduct('p1', title, 'amazon', 'https://amazon.com/p', price, score);
}

class FakeStore {
  readonly name: string;
  private readonly products: RawProduct[];
  private shouldThrow: boolean;

  constructor(name: string, products: RawProduct[], shouldThrow = false) {
    this.name = name;
    this.products = products;
    this.shouldThrow = shouldThrow;
  }

  async search(_query: string): Promise<RawProduct[]> {
    if (this.shouldThrow) throw new Error('Store failed');
    return this.products;
  }
}

class FakeNormalizer {
  normalize(raw: RawProduct): Product {
    return makeProduct(raw.title);
  }
}

class FakeRanker {
  rank(products: Product[], _weights: SearchWeights): RankedProduct[] {
    return products.map((p, i) => makeRanked(p.name, 0.9 - i * 0.1));
  }
}

class FakeCache {
  private store = new Map<string, SearchResponse>();

  async get(key: string): Promise<SearchResponse | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, response: SearchResponse, _ttl: number): Promise<void> {
    this.store.set(key, response);
  }
}

describe('Grupo 1 — ProductSearch', () => {
  it('returns results with fromCache===false on first search', async () => {
    const store = new FakeStore('amazon', [makeRaw('Monitor')]);
    const uc = new ProductSearch([store], new FakeNormalizer(), new FakeRanker(), new FakeCache());
    const result = await uc.search({ query: 'monitor', weights });
    expect(result.fromCache).toBe(false);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.query).toBe('monitor');
  });

  it('returns fromCache===true on second identical search', async () => {
    const store = new FakeStore('amazon', [makeRaw('Monitor')]);
    const cache = new FakeCache();
    const uc = new ProductSearch([store], new FakeNormalizer(), new FakeRanker(), cache);
    await uc.search({ query: 'monitor', weights });
    const result2 = await uc.search({ query: 'monitor', weights });
    expect(result2.fromCache).toBe(true);
  });

  it('2 stores × 1 product each = 2 results', async () => {
    const store1 = new FakeStore('amazon', [makeRaw('Monitor 1')]);
    const store2 = new FakeStore('mercadolibre', [makeRaw('Monitor 2')]);
    const uc = new ProductSearch([store1, store2], new FakeNormalizer(), new FakeRanker(), new FakeCache());
    const result = await uc.search({ query: 'monitor', weights });
    expect(result.results.length).toBe(2);
  });

  it('all stores return empty throws AllStoresFailed', async () => {
    const store = new FakeStore('amazon', []);
    const uc = new ProductSearch([store], new FakeNormalizer(), new FakeRanker(), new FakeCache());
    await expect(uc.search({ query: 'monitor', weights })).rejects.toThrow(AllStoresFailed);
  });

  it('all stores throw throws AllStoresFailed', async () => {
    const store = new FakeStore('amazon', [], true);
    const uc = new ProductSearch([store], new FakeNormalizer(), new FakeRanker(), new FakeCache());
    await expect(uc.search({ query: 'monitor', weights })).rejects.toThrow(AllStoresFailed);
  });

  it('1 failing + 1 ok = results.length > 0', async () => {
    const ok = new FakeStore('amazon', [makeRaw('Monitor')]);
    const failing = new FakeStore('ml', [], true);
    const uc = new ProductSearch([ok, failing], new FakeNormalizer(), new FakeRanker(), new FakeCache());
    const result = await uc.search({ query: 'monitor', weights });
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('same query, different weights returns fromCache===false', async () => {
    const store = new FakeStore('amazon', [makeRaw('Monitor')]);
    const cache = new FakeCache();
    const uc = new ProductSearch([store], new FakeNormalizer(), new FakeRanker(), cache);
    await uc.search({ query: 'monitor', weights });
    const weights2 = SearchWeights.priceFocused();
    const result2 = await uc.search({ query: 'monitor', weights: weights2 });
    expect(result2.fromCache).toBe(false);
  });
});
