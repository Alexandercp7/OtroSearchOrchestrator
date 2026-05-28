import { InvalidProductUrl } from '../exceptions/SearchErrors';

export class WatchlistItem {
  readonly id: string;
  readonly userId: string;
  readonly productUrl: string;
  readonly store: string;
  readonly name: string;
  readonly addedAt: Date;

  constructor(
    id: string,
    userId: string,
    productUrl: string,
    store: string,
    name: string,
    addedAt: Date,
  ) {
    if (!productUrl) {
      throw new InvalidProductUrl(productUrl);
    }
    this.id = id;
    this.userId = userId;
    this.productUrl = productUrl;
    this.store = store;
    this.name = name;
    this.addedAt = addedAt;
  }
}
