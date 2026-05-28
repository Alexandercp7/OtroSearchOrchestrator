import { InvalidDateRange } from "../exceptions/DataRangeErrors";
export { InvalidDateRange };

export class DateRange {
    constructor(
        readonly from: Date,
        readonly to: Date
    ) {
        if (from > to) {
            throw new InvalidDateRange("'from' date must be earlier than 'to' date");
        }
    }
  static lastDays(days: number, to: Date): DateRange {
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    return new DateRange(from, to);
  }

    contains(date: Date): boolean {
        return date >= this.from && date <= this.to;
    }
}