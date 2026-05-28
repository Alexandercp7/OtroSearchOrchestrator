import { Product } from '../../domain/entities/Product';
import { RankStrategy } from '../../domain/interfaces/services/RankStrategy';
import { RankedProduct } from '../../domain/valueObjects/RankedProduct';
import { SearchWeights } from '../../domain/valueObjects/SearchWeights';

export class WeightedRankStrategy implements RankStrategy {
  rank(products: Product[], weights: SearchWeights): RankedProduct[] {
    if (products.length === 0) return [];

    const prices    = products.map((p) => p.price.amount.toNumber());
    const deliveries = products.map((p) => p.deliveryDays);
    const msis      = products.map((p) => p.msi);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const maxDel   = Math.max(...deliveries);
    const maxMsi   = Math.max(...msis);

    return products
      .map((p) => {
        const priceScore    = maxPrice === minPrice ? 1 : 1 - (p.price.amount.toNumber() - minPrice) / (maxPrice - minPrice);
        const stockScore    = p.inStock ? 1 : 0;
        const deliveryScore = maxDel === 0 ? 1 : 1 - p.deliveryDays / maxDel;
        const msiScore      = maxMsi === 0 ? 0 : p.msi / maxMsi;

        const score =
          priceScore    * weights.price    +
          stockScore    * weights.stock    +
          deliveryScore * weights.delivery +
          msiScore      * weights.msi;

        return new RankedProduct(p.id, p.title, p.store, p.url, p.price, Math.min(1, Math.max(0, score)));
      })
      .sort((a, b) => b.score - a.score);
  }
}
