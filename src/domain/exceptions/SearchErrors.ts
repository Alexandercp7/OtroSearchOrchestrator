import{DomainError} from "./DomainError";

export class InvalidProductUrl extends DomainError {
    readonly code = "INVALID_PRODUCT_URL";
    constructor(public readonly url: string) {
        super(`The product URL "${url}" is invalid.`);
    }
}

export class InvalidProduct extends DomainError  {
    readonly code = "INVALID_PRODUCT";
    constructor(public readonly reason: string) {
        super(`The product is invalid: ${reason}`);
    }
}

export class InvalidWeights extends DomainError {
    readonly code = "INVALID_WEIGHTS";
    constructor(public readonly reason: string) {
        super(`Invalid search weights: ${reason}`);
    }
}

export class InvalidScore extends DomainError {
    readonly code = "INVALID_SCORE";
    constructor(public readonly score: number) {
        super(`Invalid score: ${score}. Score must be a number between 0 and 1.`);
    }
}