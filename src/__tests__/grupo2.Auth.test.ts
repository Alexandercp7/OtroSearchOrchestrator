import { UserRegistration } from '../domain/usecases/UserRegistration';
import { UserLogin } from '../domain/usecases/UserLogin';
import { TokenRefresh } from '../domain/usecases/TokenRefresh';
import { User } from '../domain/entities/User';
import { Email } from '../domain/valueObjects/Email';
import { asPasswordHash } from '../domain/valueObjects/PasswordHash';
import { UserAlreadyExists, InvalidCredentials } from '../domain/exceptions/UserErrors';
import { TokenPair, TokenPayload } from '../domain/interfaces/gateways/TokenGateway';

// Fake implementations
class FakeUserRepo {
  private users: User[] = [];

  async findByEmail(email: Email): Promise<User | null> {
    return this.users.find(u => u.email.equals(email)) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) ?? null;
  }

  async save(user: User): Promise<void> {
    this.users.push(user);
  }
}

class FakeAuthGateway {
  async hashPassword(plain: string): Promise<string> {
    return `access-hash-${plain}-padding-long-enough`;
  }

  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return hash === `access-hash-${plain}-padding-long-enough`;
  }

  async createTokens(payload: TokenPayload): Promise<TokenPair> {
    return {
      accessToken: `access-${payload.userId}`,
      refreshToken: `refresh-${payload.userId}`,
    };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    return { userId: 'user', email: 'user@example.com' };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    return {
      accessToken: `new-at-${refreshToken}`,
      refreshToken: `new-rt-${refreshToken}`,
    };
  }
}

class FakePasswordGateway {
  private correctPassword = 'correct-password';

  async hashPassword(plain: string): Promise<string> {
    return '$2b$10$aaaaaaaaaaaaaaaaaaaa1'; // 21 chars
  }

  async verifyPassword(plain: string, _hash: string): Promise<boolean> {
    return plain === this.correctPassword;
  }
}

class FakeTokenGateway {
  async createTokens(payload: TokenPayload): Promise<TokenPair> {
    return {
      accessToken: `at-${payload.userId}`,
      refreshToken: `rt-${payload.userId}`,
    };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    return { userId: 'user', email: 'user@example.com' };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    return {
      accessToken: `new-at-${refreshToken}`,
      refreshToken: `new-rt-${refreshToken}`,
    };
  }
}

describe('Grupo 2 — UserRegistration', () => {
  it('registers new user and returns tokens', async () => {
    const repo = new FakeUserRepo();
    const auth = new FakeAuthGateway();
    const uc = new UserRegistration(repo, auth, auth);
    const result = await uc.register({ email: 'user@example.com', password: 'secret' });
    expect(result.userId).toBeTruthy();
    expect(result.accessToken).toContain('access-');
    expect(result.refreshToken).toContain('refresh-');
  });

  it('throws UserAlreadyExists on second registration with same email', async () => {
    const repo = new FakeUserRepo();
    const auth = new FakeAuthGateway();
    const uc = new UserRegistration(repo, auth, auth);
    await uc.register({ email: 'user@example.com', password: 'secret' });
    await expect(uc.register({ email: 'user@example.com', password: 'secret' })).rejects.toThrow(UserAlreadyExists);
  });
});

describe('Grupo 2 — UserLogin', () => {
  async function setupUser(repo: FakeUserRepo) {
    const email = new Email('user@example.com');
    const hash = asPasswordHash('$2b$10$aaaaaaaaaaaaaaaaaaaa1');
    const user = new User('user-1', email, hash, new Date());
    await repo.save(user);
    return user;
  }

  it('login returns userId and tokens', async () => {
    const repo = new FakeUserRepo();
    const passwords = new FakePasswordGateway();
    const tokens = new FakeTokenGateway();
    await setupUser(repo);
    const uc = new UserLogin(repo, passwords, tokens);
    const result = await uc.login({ email: 'user@example.com', password: 'correct-password' });
    expect(result.userId).toBe('user-1');
    expect(result.accessToken).toContain('at-');
    expect(result.refreshToken).toContain('rt-');
  });

  it('user not found throws InvalidCredentials', async () => {
    const repo = new FakeUserRepo();
    const passwords = new FakePasswordGateway();
    const tokens = new FakeTokenGateway();
    const uc = new UserLogin(repo, passwords, tokens);
    await expect(uc.login({ email: 'none@example.com', password: 'pass' })).rejects.toThrow(InvalidCredentials);
  });

  it('wrong password throws InvalidCredentials', async () => {
    const repo = new FakeUserRepo();
    const passwords = new FakePasswordGateway();
    const tokens = new FakeTokenGateway();
    await setupUser(repo);
    const uc = new UserLogin(repo, passwords, tokens);
    await expect(uc.login({ email: 'user@example.com', password: 'wrong' })).rejects.toThrow(InvalidCredentials);
  });

  it('same error message for user not found and wrong password', async () => {
    const repo = new FakeUserRepo();
    const passwords = new FakePasswordGateway();
    const tokens = new FakeTokenGateway();
    await setupUser(repo);
    const uc = new UserLogin(repo, passwords, tokens);

    let notFoundMsg = '';
    let wrongPassMsg = '';

    try {
      await uc.login({ email: 'none@example.com', password: 'pass' });
    } catch (e: any) {
      notFoundMsg = e.message;
    }

    try {
      await uc.login({ email: 'user@example.com', password: 'wrong' });
    } catch (e: any) {
      wrongPassMsg = e.message;
    }

    expect(notFoundMsg).toBe(wrongPassMsg);
  });
});

describe('Grupo 2 — TokenRefresh', () => {
  it('refresh returns new token pair', async () => {
    const tokens = new FakeTokenGateway();
    const uc = new TokenRefresh(tokens);
    const result = await uc.refresh('my-refresh-token');
    expect(result.accessToken).toBe('new-at-my-refresh-token');
    expect(result.refreshToken).toBe('new-rt-my-refresh-token');
  });
});
