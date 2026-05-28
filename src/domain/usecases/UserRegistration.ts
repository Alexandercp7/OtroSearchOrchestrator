import { AuthResponse } from "../dtos/auth/AuthResponse";
import { RegistrationRequest } from "../dtos/auth/RegistrationRequest";
import { User } from "../entities/User";
import { UserAlreadyExists } from "../exceptions/UserErrors";
import { PasswordGateway, TokenGateway } from "../interfaces/gateways/AuthGateway";
import { IdGenerator } from "../interfaces/gateways/IdGenerator";
import { UserRepository } from "../interfaces/repositories/UserRepository";
import { DisplayName } from "../valueObjects/DisplayName";
import { Email } from "../valueObjects/Email";
import { asPasswordHash } from "../valueObjects/PasswordHash";

export class UserRegistration {
    constructor(
        private readonly users: UserRepository,
        private readonly password: PasswordGateway,
        private readonly tokens: TokenGateway,
        private readonly idGenerator: IdGenerator,
    ) {}

    async register(request: RegistrationRequest): Promise<AuthResponse> {
        const email = new Email(request.email);
        const displayName = new DisplayName(request.name);

        if(await this.users.findByEmail(email)){ 
            throw new UserAlreadyExists(email.value);
        }

        const passwordHash = await this.password.hashPassword(request.password);
        const userId = this.idGenerator.generate();
        const user = new User(userId, email, asPasswordHash(passwordHash), new Date(), displayName);
        await this.users.save(user);

        const tokenPair = await this.tokens.createTokens({ userId: user.id, email: email.value });
        return {
            userId: user.id,
            accessToken: tokenPair.accessToken,
            refreshToken: tokenPair.refreshToken,
        };
    }
}
