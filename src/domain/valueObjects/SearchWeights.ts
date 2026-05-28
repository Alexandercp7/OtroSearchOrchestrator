import {InvalidWeights} from "../exceptions/SearchErrors";

const EPSILON = 0.001;

export class SearchWeights {
    readonly priceWeight: number;
    readonly deliveryWeight: number;
    readonly inStockWeight: number;
    readonly msiWeight: number;

    constructor(priceWeight: number, deliveryWeight: number, inStockWeight: number, msiWeight: number) {
        this.assertRange(priceWeight, "priceWeight");
        this.assertRange(deliveryWeight, "deliveryWeight");
        this.assertRange(inStockWeight, "inStockWeight");
        this.assertRange(msiWeight, "msiWeight");

        const sum = priceWeight + deliveryWeight + inStockWeight + msiWeight;
        if(Math.abs(sum - 1) > EPSILON){
            throw new InvalidWeights(`Weights must sum to 1, got ${sum}`);
        }
        this.priceWeight = priceWeight;
        this.deliveryWeight = deliveryWeight;
        this.inStockWeight = inStockWeight;
        this.msiWeight = msiWeight;
    }
    static balanced(): SearchWeights {
        return new SearchWeights(0.25, 0.25, 0.25, 0.25);
    }

    static priceFocused(): SearchWeights {
        return new SearchWeights(0.5, 0.2, 0.2, 0.1);
    }
    
  toCacheKey(): string {
    return `${this.priceWeight}:${this.inStockWeight}:${this.deliveryWeight}:${this.msiWeight}`;
  }

    private assertRange(value: number, name: string): void {
        if(Number.isNaN(value) || value < 0 || value > 1){
            throw new InvalidWeights(`${name} must be a number between 0 and 1, got ${value}`);
        }
    }
}
