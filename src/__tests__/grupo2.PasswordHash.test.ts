import { asPasswordHash, InvalidPasswordHash } from '../domain/valueObjects/PasswordHash';
import { DomainError } from '../domain/exceptions/DomainError';

describe('Grupo 2 — PasswordHash', () => {
  const validHash = '$2b$10$aaaaaaaaaaaaaaaaaaaa'; // exactly 22 chars (> 20)

  it('returns string value intact for valid hash', () => {
    const hash = asPasswordHash(validHash);
    expect(hash).toBe(validHash);
  });

  it('exactly 20 chars is valid', () => {
    const h = 'a'.repeat(20);
    expect(() => asPasswordHash(h)).not.toThrow();
  });

  it('strings > 20 chars are valid', () => {
    const h = 'a'.repeat(25);
    expect(() => asPasswordHash(h)).not.toThrow();
  });

  it('less than 20 chars throws InvalidPasswordHash', () => {
    expect(() => asPasswordHash('short')).toThrow(InvalidPasswordHash);
  });

  it('empty string throws InvalidPasswordHash', () => {
    expect(() => asPasswordHash('')).toThrow(InvalidPasswordHash);
  });

  it('19-char string throws InvalidPasswordHash', () => {
    expect(() => asPasswordHash('a'.repeat(19))).toThrow(InvalidPasswordHash);
  });

  it('InvalidPasswordHash extends DomainError', () => {
    expect(new InvalidPasswordHash('test')).toBeInstanceOf(DomainError);
  });
});
