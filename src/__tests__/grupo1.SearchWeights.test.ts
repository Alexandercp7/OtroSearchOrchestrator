import { SearchWeights } from '../domain/valueObjects/SearchWeights';
import { InvalidWeights } from '../domain/exceptions/SearchErrors';

describe('Grupo 1 — SearchWeights', () => {
  it('creates with correct field names', () => {
    const w = new SearchWeights(0.4, 0.3, 0.2, 0.1);
    expect(w.price).toBe(0.4);
    expect(w.stock).toBe(0.3);
    expect(w.delivery).toBe(0.2);
    expect(w.msi).toBe(0.1);
  });

  it('throws InvalidWeights when sum is not 1', () => {
    expect(() => new SearchWeights(0.5, 0.5, 0.5, 0.5)).toThrow(InvalidWeights);
  });

  it('throws InvalidWeights for negative weight', () => {
    expect(() => new SearchWeights(-0.1, 0.4, 0.4, 0.3)).toThrow(InvalidWeights);
  });

  it('throws InvalidWeights for weight > 1', () => {
    expect(() => new SearchWeights(1.1, 0.0, 0.0, 0.0)).toThrow(InvalidWeights);
  });

  it('balanced() returns 0.25 for all', () => {
    const w = SearchWeights.balanced();
    expect(w.price).toBe(0.25);
    expect(w.stock).toBe(0.25);
    expect(w.delivery).toBe(0.25);
    expect(w.msi).toBe(0.25);
  });

  it('priceFocused() returns 0.7/0.1/0.1/0.1', () => {
    const w = SearchWeights.priceFocused();
    expect(w.price).toBe(0.7);
    expect(w.stock).toBe(0.1);
    expect(w.delivery).toBe(0.1);
    expect(w.msi).toBe(0.1);
  });
});
