import { Pool, RowDataPacket } from 'mysql2/promise';
import { PriceSnapshot } from '../../../domain/entities/PriceSnapshot';
import { PriceHistoryRepository } from '../../../domain/interfaces/repositories/PriceHistoryRepository';
import { DateRange } from '../../../domain/valueObjects/DateRange';
import { Money } from '../../../domain/valueObjects/Money';
import { PriceSnapshotMapper, PriceSnapshotRow } from '../mappers/PriceSnapshotMapper';

export class MysqlPriceHistoryRepository implements PriceHistoryRepository {
  constructor(private readonly db: Pool) {}

  async saveSnapshot(snapshot: PriceSnapshot): Promise<void> {
    const row = PriceSnapshotMapper.toRow(snapshot);
    await this.db.query(
      'INSERT INTO price_snapshots (id, product_url, store, amount, currency, scraped_at) VALUES (?, ?, ?, ?, ?, ?)',
      [row.id, row.product_url, row.store, row.amount, row.currency, row.scraped_at],
    );
  }

  async getHistory(productUrl: string, dateRange: DateRange): Promise<PriceSnapshot[]> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      'SELECT * FROM price_snapshots WHERE product_url = ? AND scraped_at BETWEEN ? AND ? ORDER BY scraped_at ASC',
      [productUrl, dateRange.from, dateRange.to],
    );
    return (rows as PriceSnapshotRow[]).map(PriceSnapshotMapper.toDomain);
  }

  async getLatest(productUrl: string): Promise<PriceSnapshot | null> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      'SELECT * FROM price_snapshots WHERE product_url = ? ORDER BY scraped_at DESC LIMIT 1',
      [productUrl],
    );
    if (rows.length === 0) return null;
    return PriceSnapshotMapper.toDomain(rows[0] as PriceSnapshotRow);
  }

  async getMin(productUrl: string, dateRange: DateRange): Promise<Money | null> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      `SELECT amount, currency FROM price_snapshots
       WHERE product_url = ? AND scraped_at BETWEEN ? AND ?
       ORDER BY CAST(amount AS DECIMAL(15,4)) ASC LIMIT 1`,
      [productUrl, dateRange.from, dateRange.to],
    );
    if (rows.length === 0) return null;
    return new Money(rows[0]['amount'] as string, rows[0]['currency'] as string);
  }

  async getMax(productUrl: string, dateRange: DateRange): Promise<Money | null> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      `SELECT amount, currency FROM price_snapshots
       WHERE product_url = ? AND scraped_at BETWEEN ? AND ?
       ORDER BY CAST(amount AS DECIMAL(15,4)) DESC LIMIT 1`,
      [productUrl, dateRange.from, dateRange.to],
    );
    if (rows.length === 0) return null;
    return new Money(rows[0]['amount'] as string, rows[0]['currency'] as string);
  }
}
