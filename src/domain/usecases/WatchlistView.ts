import { WatchlistItemView } from "../dtos/watchlist/WatchlistItemView";
import { PriceHistoryRepository } from "../interfaces/repositories/PriceHistoryRepository";
import { WatchlistRepository } from "../interfaces/repositories/WatchlistRepository";

export class WatchlistView {
    constructor(
        private watchlist: WatchlistRepository,
        private history: PriceHistoryRepository
    ) {}

    async list(userId: string): Promise<WatchlistItemView[]> {
        const items = await this.watchlist.findByUserId(userId);

        return Promise.all(
            items.map(async (item) => {
                const latestSnapshot = await this.history.getLatest(item.productUrl);
                return {
                    id: item.id,
                    productUrl: item.productUrl,
                    title: item.title,
                    store: item.store,
                    addedAt: item.addedAt,
                    currentPrice: latestSnapshot ? latestSnapshot.price : null
                }
            })
        );
    }
}