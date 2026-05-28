import { PriceSnapshot } from "../../entities/PriceSnapshot";
import { DateRange } from "../../valueObjects/DateRange";
import { Money } from "../../valueObjects/Money";

export interface PriceHistoryRepository {
    saveSnapshot(snapshot: PriceSnapshot): Promise<void>;
    getHistory(productUrl: string, daterange: DateRange): Promise<PriceSnapshot[]>;
    getLatest(productUrl: string): Promise<PriceSnapshot | null>;
    getMin(productUrl: string, daterange: DateRange): Promise<Money | null>;
    getMax(productUrl: string, daterange: DateRange): Promise<Money | null>;
}