import { Alert } from '../../../domain/entities/Alert';
import { AlertCondition } from '../../../domain/valueObjects/AlertCondition';
import { Money } from '../../../domain/valueObjects/Money';

export interface AlertRow {
  id: string;
  user_id: string;
  product_url: string;
  condition_json: string;
  active: number | boolean;
  last_triggered_at: Date | string | null;
}

export class AlertMapper {
  static toDomain(row: AlertRow): Alert {
    const condition = AlertMapper.parseCondition(row.condition_json);
    return new Alert(
      row.id,
      row.user_id,
      row.product_url,
      condition,
      Boolean(row.active),
      row.last_triggered_at ? new Date(row.last_triggered_at) : null,
    );
  }

  static toRow(alert: Alert): AlertRow {
    return {
      id:                alert.id,
      user_id:           alert.userId,
      product_url:       alert.productUrl,
      condition_json:    JSON.stringify(AlertMapper.serializeCondition(alert.condition)),
      active:            alert.active ? 1 : 0,
      last_triggered_at: alert.lastTriggeredAt,
    };
  }

  private static serializeCondition(condition: AlertCondition): unknown {
    if (condition.kind === 'PriceBelow') {
      return {
        kind:      condition.kind,
        amount:    condition.threshold.amount.toString(),
        currency:  condition.threshold.currency,
      };
    }
    return condition;
  }

  private static parseCondition(json: string): AlertCondition {
    const raw = JSON.parse(json) as Record<string, unknown>;
    if (raw['kind'] === 'PriceBelow') {
      return {
        kind:      'PriceBelow',
        threshold: new Money(raw['amount'] as string, raw['currency'] as string),
      };
    }
    if (raw['kind'] === 'PriceAtMin') {
      return { kind: 'PriceAtMin', lookbackDays: raw['lookbackDays'] as number };
    }
    if (raw['kind'] === 'PriceDropPct') {
      return {
        kind:         'PriceDropPct',
        percent:      raw['percent'] as number,
        lookbackDays: raw['lookbackDays'] as number,
      };
    }
    throw new Error(`Unknown AlertCondition kind in DB: "${raw['kind']}"`);
  }
}
