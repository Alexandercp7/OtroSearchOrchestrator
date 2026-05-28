import { RankedProduct } from '../../valueObjects/RankedProduct';

export interface SearchResponse {
  query: string;
  results: RankedProduct[];
  fromCache: boolean;
}
