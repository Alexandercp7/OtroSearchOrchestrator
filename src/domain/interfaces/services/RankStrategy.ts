import { Product } from '../../entities/Product';
import { RankedProduct } from '../../valueObjects/RankedProduct';
import { SearchWeights } from '../../valueObjects/SearchWeights';

export interface RankStrategy {
  rank(products: Product[], weights: SearchWeights): RankedProduct[];
}
