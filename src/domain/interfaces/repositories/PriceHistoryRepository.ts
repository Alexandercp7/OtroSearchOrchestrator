import { PriceSnapshot } from "../../entities/PriceSnapshot";
import { DateRange } from "../../valueObjects/DateRange";
import { Money } from "../../valueObjects/Money";

export interface PriceHistoryRepository {
    saveSnapshot(snapshot: PriceSnapshot): Promise<void>;
    getHistory(productUrl: string, daterange: DateRange): Promise<PriceSnapshot[]>;
    getLatestPrice(productUrl: string): Promise<Money | null>;
    getMinPrice(productUrl: string, daterange: DateRange): Promise<Money | null>;
    getMaxPrice(productUrl: string, daterange: DateRange): Promise<Money | null>;
}