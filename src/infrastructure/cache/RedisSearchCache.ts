import { createClient, RedisClientType } from 'redis';
import { SearchResponse } from '../../domain/dtos/search/SearchResponse';
import { SearchCache } from '../../domain/interfaces/services/SearchCache';

export class RedisSearchCache implements SearchCache {
  private constructor(private readonly client: RedisClientType) {}

  static async create(url: string = process.env.REDIS_URL ?? 'redis://localhost:6379'): Promise<RedisSearchCache> {
    const client = createClient({ url }) as RedisClientType;
    await client.connect();
    return new RedisSearchCache(client);
  }

  async get(key: string): Promise<SearchResponse | null> {
    const raw = await this.client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as SearchResponse;
  }

  async set(key: string, response: SearchResponse, ttlSeconds: number): Promise<void> {
    await this.client.set(key, JSON.stringify(response), { EX: ttlSeconds });
  }
}
