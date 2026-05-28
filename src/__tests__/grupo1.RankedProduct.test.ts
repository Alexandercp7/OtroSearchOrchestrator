import { RankedProduct, InvalidScore } from '../domain/dtos/search/RankedProduct';
import { Money } from '../domain/valueObjects/Money';
import { DomainError } from '../domain/exceptions/DomainError';

describe('Grupo 1 — RankedProduct', () => {
  const price = new Money(100, 'MXN');

  it('creates with title field (not name)', () => {
    const p = new RankedProduct('id1', 'Monitor', 'amazon', 'https://amazon.com/p', price, 0.8);
    expect(p.productId).toBe('id1');
    expect(p.title).toBe('Monitor');
    expect(p.store).toBe('amazon');
    expect(p.url).toBe('https://amazon.com/p');
    expect(p.price).toBe(price);
    expect(p.score).toBe(0.8);
  });

  it('score 0 is valid', () => {
    expect(() => new RankedProduct('id1', 'Monitor', 'amazon', 'https://a.com', price, 0)).not.toThrow();
  });

  it('score 1 is valid', () => {
    expect(() => new RankedProduct('id1', 'Monitor', 'amazon', 'https://a.com', price, 1)).not.toThrow();
  });

  it('NaN score throws InvalidScore', () => {
    expect(() => new RankedProduct('id1', 'Monitor', 'amazon', 'https://a.com', price, NaN)).toThrow(InvalidScore);
  });

  it('score < 0 throws InvalidScore', () => {
    expect(() => new RankedProduct('id1', 'Monitor', 'amazon', 'https://a.com', price, -0.1)).toThrow(InvalidScore);
  });

  it('score > 1 throws InvalidScore', () => {
    expect(() => new RankedProduct('id1', 'Monitor', 'amazon', 'https://a.com', price, 1.1)).toThrow(InvalidScore);
  });

  it('InvalidScore extends DomainError', () => {
    expect(new InvalidScore(2)).toBeInstanceOf(DomainError);
  });
});
