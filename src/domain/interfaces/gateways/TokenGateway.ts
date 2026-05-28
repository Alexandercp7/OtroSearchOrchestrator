export interface TokenPair{
    accessToken: string;
    refreshToken: string;
}

export interface TokenPayload {
    userId: string;
    email: string;
}

export interface TokenGateway {
    generateTokens(payload: TokenPayload): Promise<TokenPair>;
    verifyAccessToken(token: string): Promise<TokenPayload>;
    verifyRefreshToken(token: string): Promise<TokenPayload>;
}