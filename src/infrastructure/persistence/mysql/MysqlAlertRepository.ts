import { Pool, RowDataPacket } from 'mysql2/promise';
import { Alert } from '../../../domain/entities/Alert';
import { AlertRepository } from '../../../domain/interfaces/repositories/AlertRepository';
import { AlertMapper, AlertRow } from '../mappers/AlertMapper';

export class MysqlAlertRepository implements AlertRepository {
  constructor(private readonly db: Pool) {}

  async findById(id: string): Promise<Alert | null> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      'SELECT * FROM alerts WHERE id = ? LIMIT 1',
      [id],
    );
    if (rows.length === 0) return null;
    return AlertMapper.toDomain(rows[0] as AlertRow);
  }

  async findActive(): Promise<Alert[]> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      'SELECT * FROM alerts WHERE active = 1',
    );
    return (rows as AlertRow[]).map(AlertMapper.toDomain);
  }

  async findByUser(userId: string): Promise<Alert[]> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      'SELECT * FROM alerts WHERE user_id = ?',
      [userId],
    );
    return (rows as AlertRow[]).map(AlertMapper.toDomain);
  }

  async save(alert: Alert): Promise<void> {
    const row = AlertMapper.toRow(alert);
    await this.db.query(
      `INSERT INTO alerts (id, user_id, product_url, condition_json, active, last_triggered_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         condition_json     = VALUES(condition_json),
         active             = VALUES(active),
         last_triggered_at  = VALUES(last_triggered_at)`,
      [row.id, row.user_id, row.product_url, row.condition_json, row.active, row.last_triggered_at],
    );
  }

  async remove(id: string): Promise<void> {
    await this.db.query('DELETE FROM alerts WHERE id = ?', [id]);
  }
}
