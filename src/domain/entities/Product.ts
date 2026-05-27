import { InvalidProduct } from "../exceptions/SearchErrors"
import { Money } from "../valueObjects/Money";

export class Product {
    readonly id: string;
    readonly name: string;
    readonly price: Money;
    readonly store: string;
    readonly url: string;
    readonly inStock: boolean;
    readonly deliveryDays: number;
    readonly msi: number;

    constructor(
        id: string,
        name: string,
        price: Money,
        store: string,
        url: string,
        inStock: boolean,
        deliveryDays: number,
        msi: number = 0,
    ) {
        if(deliveryDays < 0){
            throw new InvalidProduct("deliveryDays cannot be negative");
        }
        if(msi < 0){
            throw new InvalidProduct("MSI cannot be negative");
        }
        this.id = id;
        this.name = name;
        this.price = price;
        this.store = store;
        this.url = url;
        this.inStock = inStock;
        this.deliveryDays = deliveryDays;
        this.msi = msi;
    }
}