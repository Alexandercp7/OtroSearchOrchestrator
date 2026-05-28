import { Pool, RowDataPacket } from 'mysql2/promise';
import { WatchlistItem } from '../../../domain/entities/WatchlistItem';
import { WatchlistRepository } from '../../../domain/interfaces/repositories/WatchlistRepository';
import { WatchlistItemMapper, WatchlistItemRow } from '../mappers/WatchlistItemMapper';

export class MysqlWatchlistRepository implements WatchlistRepository {
  constructor(private readonly db: Pool) {}

  async findById(id: string): Promise<WatchlistItem | null> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      'SELECT * FROM watchlist_items WHERE id = ? LIMIT 1',
      [id],
    );
    if (rows.length === 0) return null;
    return WatchlistItemMapper.toDomain(rows[0] as WatchlistItemRow);
  }

  async findByUserId(userId: string): Promise<WatchlistItem[]> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      'SELECT * FROM watchlist_items WHERE user_id = ?',
      [userId],
    );
    return (rows as WatchlistItemRow[]).map(WatchlistItemMapper.toDomain);
  }

  async findAll(): Promise<WatchlistItem[]> {
    const [rows] = await this.db.query<RowDataPacket[]>('SELECT * FROM watchlist_items');
    return (rows as WatchlistItemRow[]).map(WatchlistItemMapper.toDomain);
  }

  async exists(userId: string, productUrl: string): Promise<boolean> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      'SELECT 1 FROM watchlist_items WHERE user_id = ? AND product_url = ? LIMIT 1',
      [userId, productUrl],
    );
    return rows.length > 0;
  }

  async save(item: WatchlistItem): Promise<void> {
    const row = WatchlistItemMapper.toRow(item);
    await this.db.query(
      `INSERT INTO watchlist_items (id, user_id, product_url, store, title, added_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title)`,
      [row.id, row.user_id, row.product_url, row.store, row.title, row.added_at],
    );
  }

  async remove(id: string): Promise<void> {
    await this.db.query('DELETE FROM watchlist_items WHERE id = ?', [id]);
  }
}
