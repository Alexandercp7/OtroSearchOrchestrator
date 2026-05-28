import { Pool, RowDataPacket } from 'mysql2/promise';
import { User } from '../../../domain/entities/User';
import { UserRepository } from '../../../domain/interfaces/repositories/UserRepository';
import { Email } from '../../../domain/valueObjects/Email';
import { UserMapper, UserRow } from '../mappers/UserMapper';

export class MysqlUserRepository implements UserRepository {
  constructor(private readonly db: Pool) {}

  async findByEmail(email: Email): Promise<User | null> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email.value],
    );
    if (rows.length === 0) return null;
    return UserMapper.toDomain(rows[0] as UserRow);
  }

  async findById(id: string): Promise<User | null> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id],
    );
    if (rows.length === 0) return null;
    return UserMapper.toDomain(rows[0] as UserRow);
  }

  async save(user: User): Promise<void> {
    const row = UserMapper.toRow(user);
    await this.db.query(
      `INSERT INTO users (id, email, password_hash, display_name, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE display_name = VALUES(display_name)`,
      [row.id, row.email, row.password_hash, row.display_name, row.created_at],
    );
  }
}
