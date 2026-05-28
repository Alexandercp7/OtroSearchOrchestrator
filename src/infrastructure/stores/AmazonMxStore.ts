import { RawProduct } from '../../domain/dtos/search/RawProduct';
import { Store } from '../../domain/interfaces/stores/Store';
import { HttpClient } from './http/HttpClient';

export class AmazonMxStore implements Store {
  readonly name = 'amazon';

  constructor(private readonly http: HttpClient) {}

  async search(query: string): Promise<RawProduct[]> {
    throw new Error('Not implemented');
  }

  async fetchOne(url: string): Promise<RawProduct | null> {
    throw new Error('Not implemented');
  }
}
