import { User } from '../domain/entities/User';
import { Email } from '../domain/valueObjects/Email';
import { asPasswordHash } from '../domain/valueObjects/PasswordHash';

describe('Grupo 2 — User', () => {
  it('creates with all fields', () => {
    const email = new Email('user@example.com');
    const hash = asPasswordHash('$2b$10$aaaaaaaaaaaaaaaaaaaa');
    const createdAt = new Date();
    const user = new User('user-1', email, hash, createdAt);
    expect(user.id).toBe('user-1');
    expect(user.email).toBe(email);
    expect(user.passwordHash).toBe(hash);
    expect(user.createdAt).toBe(createdAt);
  });
});
