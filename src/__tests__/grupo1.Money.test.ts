import { Money, InvalidMoney } from '../domain/valueObjects/Money';
import { DomainError } from '../domain/exceptions/DomainError';

describe('Grupo 1 — Money', () => {
  it('normalizes currency to uppercase', () => {
    const m = new Money(100, 'mxn');
    expect(m.amount.toNumber()).toBe(100);
    expect(m.currency).toBe('MXN');
  });

  it('throws InvalidMoney for negative amount', () => {
    expect(() => new Money(-1, 'MXN')).toThrow(InvalidMoney);
  });

  it('throws InvalidMoney for invalid currency (too long)', () => {
    expect(() => new Money(100, 'PESOS')).toThrow(InvalidMoney);
  });

  it('throws InvalidMoney for invalid currency (numbers)', () => {
    expect(() => new Money(100, '12X')).toThrow(InvalidMoney);
  });

  it('adds two Money values with same currency', () => {
    const result = new Money(10, 'MXN').add(new Money(5, 'MXN'));
    expect(result.amount.toNumber()).toBe(15);
  });

  it('throws InvalidMoney when adding different currencies', () => {
    expect(() => new Money(10, 'MXN').add(new Money(5, 'USD'))).toThrow(InvalidMoney);
  });

  it('calculates percentDropFrom', () => {
    const drop = new Money(80, 'MXN').percentDropFrom(new Money(100, 'MXN'));
    expect(drop).toBe(20);
  });

  it('InvalidMoney extends DomainError', () => {
    expect(new InvalidMoney('test')).toBeInstanceOf(DomainError);
  });

  it('isLessThan works', () => {
    expect(new Money(5, 'MXN').isLessThan(new Money(10, 'MXN'))).toBe(true);
    expect(new Money(10, 'MXN').isLessThan(new Money(5, 'MXN'))).toBe(false);
  });

  it('isGreaterThan works', () => {
    expect(new Money(10, 'MXN').isGreaterThan(new Money(5, 'MXN'))).toBe(true);
  });

  it('equals works', () => {
    expect(new Money(100, 'MXN').equals(new Money(100, 'MXN'))).toBe(true);
    expect(new Money(100, 'MXN').equals(new Money(200, 'MXN'))).toBe(false);
  });
});
