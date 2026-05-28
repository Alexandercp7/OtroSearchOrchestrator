import { User } from "../../entities/User";
import { Email } from "../../valueObjects/Email";

export interface UserRepository {
    findByEmail(email: Email): Promise<User | null>;
    save(user: User): Promise<void>;
    findById(id: string): Promise<User | null>;
}