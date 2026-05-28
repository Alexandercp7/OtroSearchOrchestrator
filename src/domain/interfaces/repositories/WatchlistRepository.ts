import { WatchlistItem } from "../../entities/WatchlistItem";

export interface WatchlistRepository {
    findById(id: string): Promise<WatchlistItem | null>;
    findByUserId(userId: string): Promise<WatchlistItem[]>;
    findAll(): Promise<WatchlistItem[]>;
    exists(userId: string, productUrl: string): Promise<boolean>;
    save(watchlistItem: WatchlistItem): Promise<void>;
    remove(id: string): Promise<void>;
}