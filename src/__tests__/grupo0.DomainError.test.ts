import { DomainError } from '../domain/exceptions/DomainError';

describe('Grupo 0 — DomainError', () => {
  it('is an abstract class extending Error', () => {
    class ConcreteError extends DomainError {
      readonly code = 'CONCRETE';
    }
    const err = new ConcreteError('test message');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(DomainError);
    expect(err.message).toBe('test message');
    expect(err.name).toBe('ConcreteError');
  });
});
