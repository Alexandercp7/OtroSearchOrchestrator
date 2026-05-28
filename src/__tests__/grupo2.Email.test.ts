import { Email, InvalidEmail } from '../domain/valueObjects/Email';
import { DomainError } from '../domain/exceptions/DomainError';

describe('Grupo 2 — Email', () => {
  it('normalizes email to lowercase', () => {
    const e = new Email('USER@Example.COM');
    expect(e.value).toBe('user@example.com');
  });

  it('trims whitespace', () => {
    const e = new Email('  user@example.com  ');
    expect(e.value).toBe('user@example.com');
  });

  it('throws InvalidEmail when no @', () => {
    expect(() => new Email('userexample.com')).toThrow(InvalidEmail);
  });

  it('throws InvalidEmail for user@ only', () => {
    expect(() => new Email('user@')).toThrow(InvalidEmail);
  });

  it('throws InvalidEmail for @example.com', () => {
    expect(() => new Email('@example.com')).toThrow(InvalidEmail);
  });

  it('throws InvalidEmail for space in local part', () => {
    expect(() => new Email('user name@example.com')).toThrow(InvalidEmail);
  });

  it('throws InvalidEmail for empty string', () => {
    expect(() => new Email('')).toThrow(InvalidEmail);
  });

  it('equals() returns true for same email regardless of case', () => {
    const e1 = new Email('user@example.com');
    const e2 = new Email('USER@EXAMPLE.COM');
    expect(e1.equals(e2)).toBe(true);
  });

  it('equals() returns false for different emails', () => {
    const e1 = new Email('user@example.com');
    const e2 = new Email('other@example.com');
    expect(e1.equals(e2)).toBe(false);
  });

  it('toString() returns normalized value', () => {
    const e = new Email('USER@Example.COM');
    expect(e.toString()).toBe('user@example.com');
  });

  it('InvalidEmail extends DomainError', () => {
    expect(new InvalidEmail('test')).toBeInstanceOf(DomainError);
  });
});
