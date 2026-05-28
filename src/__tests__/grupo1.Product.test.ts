import { Product } from '../domain/entities/Product';
import { InvalidProduct } from '../domain/exceptions/SearchErrors';
import { Money } from '../domain/valueObjects/Money';
import { DomainError } from '../domain/exceptions/DomainError';

describe('Grupo 1 — Product', () => {
  const price = new Money(500, 'MXN');

  it('creates with title field and all properties', () => {
    const p = new Product('id', 'Monitor', price, 'amazon', 'https://amazon.com/p', true, 3, 12);
    expect(p.id).toBe('id');
    expect(p.title).toBe('Monitor');
    expect(p.price).toBe(price);
    expect(p.store).toBe('amazon');
    expect(p.url).toBe('https://amazon.com/p');
    expect(p.inStock).toBe(true);
    expect(p.deliveryDays).toBe(3);
    expect(p.msi).toBe(12);
  });

  it('msi defaults to 0', () => {
    const p = new Product('id', 'Monitor', price, 'amazon', 'https://amazon.com/p', true, 3);
    expect(p.msi).toBe(0);
  });

  it('deliveryDays 0 is valid', () => {
    expect(() => new Product('id', 'Monitor', price, 'amazon', 'https://a.com', true, 0)).not.toThrow();
  });

  it('msi 0 is valid', () => {
    expect(() => new Product('id', 'Monitor', price, 'amazon', 'https://a.com', true, 3, 0)).not.toThrow();
  });

  it('negative deliveryDays throws InvalidProduct', () => {
    expect(() => new Product('id', 'Monitor', price, 'amazon', 'https://a.com', true, -1)).toThrow(InvalidProduct);
  });

  it('negative msi throws InvalidProduct', () => {
    expect(() => new Product('id', 'Monitor', price, 'amazon', 'https://a.com', true, 3, -1)).toThrow(InvalidProduct);
  });

  it('InvalidProduct extends DomainError', () => {
    expect(new InvalidProduct('test')).toBeInstanceOf(DomainError);
  });
});
