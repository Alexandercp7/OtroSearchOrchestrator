import { Product } from '../../domain/entities/Product';
import { RawProduct } from '../../domain/dtos/search/RawProduct';
import { Normalizer } from '../../domain/interfaces/services/Normalizer';
import { Money } from '../../domain/valueObjects/Money';

export class RegexNormalizer implements Normalizer {
  normalize(raw: RawProduct): Product {
    const price        = this.parsePrice(raw.priceText, raw.currency);
    const inStock      = this.parseStock(raw.inStockText);
    const deliveryDays = this.parseDelivery(raw.deliveryText);
    const msi          = this.parseMsi(raw.msiText);

    return new Product(raw.url, raw.title, price, raw.store, raw.url, inStock, deliveryDays, msi);
  }

  private parsePrice(text: string, currency: string): Money {
    const cleaned = text.replace(/[^\d.]/g, '');
    const amount  = parseFloat(cleaned) || 0;
    return new Money(amount, currency || 'MXN');
  }

  private parseStock(text: string): boolean {
    return /en\s*stock|disponible|in\s*stock|available/i.test(text);
  }

  private parseDelivery(text: string): number {
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private parseMsi(text: string): number {
    const match = text.match(/(\d+)\s*msi/i);
    return match ? parseInt(match[1], 10) : 0;
  }
}
