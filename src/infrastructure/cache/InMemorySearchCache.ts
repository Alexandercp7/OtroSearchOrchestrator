import { SearchResponse } from '../../domain/dtos/search/SearchResponse';
import { SearchCache } from '../../domain/interfaces/services/SearchCache';

interface CacheEntry {
  response: SearchResponse;
  expiresAt: number;
}

export class InMemorySearchCache implements SearchCache {
  private readonly store = new Map<string, CacheEntry>();

  async get(key: string): Promise<SearchResponse | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.response;
  }

  async set(key: string, response: SearchResponse, ttlSeconds: number): Promise<void> {
    this.store.set(key, { response, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}
