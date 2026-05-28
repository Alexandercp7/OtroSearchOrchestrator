import { load } from 'cheerio';
import { RawProduct } from '../../domain/dtos/search/RawProduct';
import { Store } from '../../domain/interfaces/stores/Store';
import { normalizeText, parseDeliveryDays } from './textUtils';

const SEARCH_URL = 'https://www.amazon.com.mx/s?k=';
const PRODUCT_URL_PREFIX = 'https://www.amazon.com.mx';
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'es-MX,es;q=0.9',
};

type $T = ReturnType<typeof load>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any;
type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

export class AmazonMxStore implements Store {
  readonly name = 'amazon';

  constructor(private readonly fetchFn: FetchFn = fetch) {}

  async search(query: string): Promise<RawProduct[]> {
    const url = SEARCH_URL + encodeURIComponent(query);
    const html = await this.fetchHtml(url);
    return this.parseSearchResults(html);
  }

  async fetchOne(url: string): Promise<RawProduct | null> {
    const html = await this.fetchHtml(url);
    return this.parseProductPage(html, url);
  }

  private async fetchHtml(url: string): Promise<string> {
    const response = await this.fetchFn(url, { headers: HEADERS });
    if (!response.ok) {
      throw new Error(`Amazon request failed: ${response.status} ${url}`);
    }
    return response.text();
  }

  private parseSearchResults(html: string): RawProduct[] {
    const $ = load(html);
    const products: RawProduct[] = [];

    $('div.puis-card-container').each((_, card) => {
      if (!this.isValidCard($, card)) return;
      const product = this.parseCard($, card);
      if (product) products.push(product);
    });

    return products;
  }

  private isValidCard($: $T, card: Node): boolean {
    return (
      $(card).find('h2 span').length > 0 && $(card).find('span.a-offscreen').length > 0
    );
  }

  private parseCard($: $T, card: Node): RawProduct | null {
    const url = this.extractUrl($, card);
    if (!url) return null;

    return {
      title: this.extractTitle($, card),
      priceText: this.extractCashPrice($, card),
      currency: 'MXN',
      store: this.name,
      url,
      inStockText: 'in stock',
      deliveryText: this.extractDeliveryText($, card),
      msiText: this.extractMsiText($, card),
    };
  }

  private extractTitle($: $T, card: Node): string {
    return $(card).find('h2 span').first().text().trim() || 'Not specified';
  }

  private extractCashPrice($: $T, card: Node): string {
    const primary = $(card)
      .find('span.a-price:not(.a-text-price) span.a-offscreen')
      .first()
      .text();
    const fallback = $(card).find('span.a-offscreen').first().text();
    const raw = (primary || fallback).trim();
    return raw.replace(/[$,]/g, '') || '0';
  }

  private extractDeliveryText($: $T, card: Node): string {
    const text = $(card).find('div.udm-primary-delivery-message').first().text();
    if (!text) return '';
    return parseDeliveryDays(normalizeText(text));
  }

  private extractMsiText($: $T, card: Node): string {
    const monthsText = $(card).find('span.a-size-base.a-color-secondary').first().text();
    if (!monthsText) return '0';
    const normalized = normalizeText(monthsText);
    if (!normalized.includes('sin interes')) return '0';
    const match = /(\d+)\s*meses/.exec(normalized);
    return match?.[1] ?? '0';
  }

  private extractUrl($: $T, card: Node): string | null {
    const href = $(card).find('a.a-link-normal').first().attr('href');
    if (!href) return null;
    return href.startsWith('/') ? PRODUCT_URL_PREFIX + href : href;
  }

  private parseProductPage(html: string, url: string): RawProduct | null {
    const $ = load(html);

    const title = $('#productTitle span').first().text().trim();
    if (!title) return null;

    const rawPrice = $('#corePriceDisplay_desktop_feature_div span.a-offscreen')
      .first()
      .text()
      .trim();
    const priceText = rawPrice.replace(/[$,]/g, '') || '0';

    const deliveryRaw = $('#mir-layout-DELIVERY_BLOCK .a-text-bold').first().text();
    const deliveryText = parseDeliveryDays(normalizeText(deliveryRaw));

    const msiRaw = $('#installmentCalculator_feature_div').first().text();
    const msiMatch = /(\d+)\s*meses/.exec(normalizeText(msiRaw));
    const msiText = msiMatch?.[1] ?? '0';

    return {
      title,
      priceText,
      currency: 'MXN',
      store: this.name,
      url,
      inStockText: 'in stock',
      deliveryText,
      msiText,
    };
  }
}
