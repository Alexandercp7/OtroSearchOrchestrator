import {Decimal} from "decimal.js";
import {InvalidMoney} from "../exceptions/MoneyErrors";

export {InvalidMoney};

export class Money {
    readonly amount: Decimal;
    readonly currency: string;

    constructor(amount: Decimal | number | string, currency: string) {
        const value = amount instanceof Decimal ? amount : new Decimal(amount);

        if(value.isNaN() || value.isNegative()){
            throw new InvalidMoney(`Amount must be a non-negative number, got ${amount}`);
        }
        const normalized = currency ? currency.toUpperCase() : '';
        if (!normalized || normalized.length !== 3 || !/^[A-Z]{3}$/.test(normalized)) {
            throw new InvalidMoney(`Currency must be a 3-letter alphabetic code, got "${currency}"`);
        }
        this.amount = value;
        this.currency = normalized;
    }
    
    
    add(other: Money): Money {
        this.assertSameCurrency(other);
        return new Money(this.amount.plus(other.amount), this.currency);
    }

    subtract(other: Money): Money {
        this.assertSameCurrency(other);
        return new Money(this.amount.minus(other.amount), this.currency);
    }

    equals(other: Money): boolean {
        return this.currency === other.currency && this.amount.equals(other.amount);
    }

    isLessThan(other: Money): boolean {
        this.assertSameCurrency(other);
        return this.amount.lessThan(other.amount);
    }

    isGreaterThan(other: Money): boolean {
        this.assertSameCurrency(other);
        return this.amount.greaterThan(other.amount);
    }

    percentDropFrom(previous: Money): number {
        this.assertSameCurrency(previous);
        if (previous.amount.isZero()) return 0;
        return previous.amount.minus(this.amount).div(previous.amount).times(100).toNumber();
    }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new InvalidMoney(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
    
}