import jwt from 'jsonwebtoken';
import { TokenGateway, TokenPair, TokenPayload } from '../../domain/interfaces/gateways/TokenGateway';
import { InvalidToken } from '../../domain/exceptions/UserErrors';

const ACCESS_TTL  = '15m';
const REFRESH_TTL = '7d';

export class JwtTokenGateway implements TokenGateway {
  constructor(
    private readonly secret: string,
    private readonly refreshSecret: string,
  ) {}

  async createTokens(payload: TokenPayload): Promise<TokenPair> {
    const accessToken  = jwt.sign(payload, this.secret,        { expiresIn: ACCESS_TTL });
    const refreshToken = jwt.sign(payload, this.refreshSecret, { expiresIn: REFRESH_TTL });
    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      return jwt.verify(token, this.secret) as TokenPayload;
    } catch {
      throw new InvalidToken();
    }
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    let payload: TokenPayload;
    try {
      payload = jwt.verify(refreshToken, this.refreshSecret) as TokenPayload;
    } catch {
      throw new InvalidToken();
    }
    return this.createTokens({ userId: payload.userId, email: payload.email });
  }
}
