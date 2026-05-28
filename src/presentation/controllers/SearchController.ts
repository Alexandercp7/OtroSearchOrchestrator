import { NextFunction, Request, Response } from 'express';
import { ProductSearch } from '../../domain/usecases/ProductSearch';
import { SearchWeights } from '../../domain/valueObjects/SearchWeights';

export class SearchController {
  constructor(private readonly productSearch: ProductSearch) {}

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, price, stock, delivery, msi } = req.query as Record<string, string>;
      const weights = new SearchWeights(
        Number(price    ?? 0.25),
        Number(stock    ?? 0.25),
        Number(delivery ?? 0.25),
        Number(msi      ?? 0.25),
      );
      const result = await this.productSearch.search({ query: query ?? '', weights });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
