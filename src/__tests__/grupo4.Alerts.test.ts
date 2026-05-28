import { Alert } from '../domain/entities/Alert';
import { AlertCondition, priceBelow, priceAtMin, priceDropPct } from '../domain/valueObjects/AlertCondition';
import { AlertCreation } from '../domain/usecases/AlertCreation';
import { AlertListing } from '../domain/usecases/AlertListing';
import { AlertRemoval } from '../domain/usecases/AlertRemoval';
import { AlertEvaluation } from '../domain/usecases/AlertEvaluation';
import { PriceBelowEvaluator } from '../domain/services/PriceBelowEvaluator';
import { PriceAtMinEvaluator } from '../domain/services/PriceAtMinEvaluator';
import { PriceDropPctEvaluator } from '../domain/services/PriceDropPctEvaluator';
import { Money } from '../domain/valueObjects/Money';
import { PriceSnapshot } from '../domain/entities/PriceSnapshot';
import { User } from '../domain/entities/User';
import { Email } from '../domain/valueObjects/Email';
import { asPasswordHash } from '../domain/valueObjects/PasswordHash';
import { AlertNotFound, InvalidAlertCondition } from '../domain/exceptions/AlertErrors';
import { InvalidProductUrl } from '../domain/exceptions/SearchErrors';
import { AlertConditionEvaluator } from '../domain/interfaces/services/AlertConditionEvaluator';
import { PriceHistoryRepository } from '../domain/interfaces/repositories/PriceHistoryRepository';
import { DateRange } from '../domain/valueObjects/DateRange';

const productUrl = 'https://amazon.com/monitor';
const price = new Money(500, 'MXN');

// Fakes
class FakeAlertRepo {
  saved: Alert[] = [];
  removed: string[] = [];
  private items: Alert[];

  constructor(initial: Alert[] = []) {
    this.items = [...initial];
  }

  async save(alert: Alert): Promise<void> {
    this.saved.push(alert);
    this.items.push(alert);
  }

  async findById(id: string): Promise<Alert | null> {
    return this.items.find(a => a.id === id) ?? null;
  }

  async findByUser(userId: string): Promise<Alert[]> {
    return this.items.filter(a => a.userId === userId);
  }

  async findActive(): Promise<Alert[]> {
    return this.items.filter(a => a.active);
  }

  async remove(id: string): Promise<void> {
    this.removed.push(id);
    this.items = this.items.filter(a => a.id !== id);
  }
}

class FakeHistoryRepo {
  private latestMap: Map<string, PriceSnapshot>;
  private historyMap: Map<string, PriceSnapshot[]>;
  private minMap: Map<string, Money | null>;

  constructor(
    latestMap: Map<string, PriceSnapshot> = new Map(),
    historyMap: Map<string, PriceSnapshot[]> = new Map(),
    minMap: Map<string, Money | null> = new Map(),
  ) {
    this.latestMap = latestMap;
    this.historyMap = historyMap;
    this.minMap = minMap;
  }

  async saveSnapshot(_snap: PriceSnapshot): Promise<void> {}

  async getLatest(productUrl: string): Promise<PriceSnapshot | null> {
    return this.latestMap.get(productUrl) ?? null;
  }

  async getHistory(productUrl: string, _range: DateRange): Promise<PriceSnapshot[]> {
    return this.historyMap.get(productUrl) ?? [];
  }

  async getMin(productUrl: string, _range: DateRange): Promise<Money | null> {
    const v = this.minMap.get(productUrl);
    return v === undefined ? null : v;
  }

  async getMax(_productUrl: string, _range: DateRange): Promise<Money | null> {
    return null;
  }
}

class FakeUserRepo {
  private users: Map<string, User>;

  constructor(users: User[] = []) {
    this.users = new Map(users.map(u => [u.id, u]));
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(_email: Email): Promise<User | null> {
    return null;
  }

  async save(_user: User): Promise<void> {}
}

class FakeNotifier {
  calls: Array<{ user: User; alert: Alert; snapshot: PriceSnapshot }> = [];

  async notify(user: User, alert: Alert, snapshot: PriceSnapshot): Promise<void> {
    this.calls.push({ user, alert, snapshot });
  }
}

function makeUser(): User {
  return new User('user-1', new Email('user@example.com'), asPasswordHash('$2b$10$aaaaaaaaaaaaaaaaaaaa1'), new Date());
}

function makeAlert(id: string, userId: string): Alert {
  return new Alert(id, userId, productUrl, priceBelow(new Money(600, 'MXN')), true, null);
}

function makeSnapshot(p: Money = price): PriceSnapshot {
  return new PriceSnapshot('s1', productUrl, 'amazon', p, new Date());
}

describe('Grupo 4 — AlertCondition', () => {
  it('priceBelow returns correct kind', () => {
    const c = priceBelow(price);
    expect(c.kind).toBe('PriceBelow');
    if (c.kind === 'PriceBelow') expect(c.threshold).toBe(price);
  });

  it('priceAtMin returns correct kind with lookbackDays', () => {
    const c = priceAtMin(30);
    expect(c.kind).toBe('PriceAtMin');
    if (c.kind === 'PriceAtMin') expect(c.lookbackDays).toBe(30);
  });

  it('priceAtMin lookbackDays 1 is valid', () => {
    expect(() => priceAtMin(1)).not.toThrow();
  });

  it('priceAtMin lookbackDays 0 throws', () => {
    expect(() => priceAtMin(0)).toThrow(InvalidAlertCondition);
  });

  it('priceAtMin negative lookbackDays throws', () => {
    expect(() => priceAtMin(-1)).toThrow(InvalidAlertCondition);
  });

  it('priceAtMin non-integer lookbackDays throws', () => {
    expect(() => priceAtMin(1.5)).toThrow(InvalidAlertCondition);
  });

  it('priceDropPct returns correct kind', () => {
    const c = priceDropPct(10, 7);
    expect(c.kind).toBe('PriceDropPct');
    if (c.kind === 'PriceDropPct') {
      expect(c.percent).toBe(10);
      expect(c.lookbackDays).toBe(7);
    }
  });

  it('priceDropPct percent 100 is VALID', () => {
    expect(() => priceDropPct(100, 7)).not.toThrow();
  });

  it('priceDropPct percent 0 throws', () => {
    expect(() => priceDropPct(0, 7)).toThrow(InvalidAlertCondition);
  });

  it('priceDropPct negative percent throws', () => {
    expect(() => priceDropPct(-1, 7)).toThrow(InvalidAlertCondition);
  });

  it('priceDropPct percent > 100 throws', () => {
    expect(() => priceDropPct(101, 7)).toThrow(InvalidAlertCondition);
  });

  it('priceDropPct NaN percent throws', () => {
    expect(() => priceDropPct(NaN, 7)).toThrow(InvalidAlertCondition);
  });

  it('priceDropPct lookbackDays 0 throws', () => {
    expect(() => priceDropPct(10, 0)).toThrow(InvalidAlertCondition);
  });

  it('priceDropPct non-integer lookbackDays throws', () => {
    expect(() => priceDropPct(10, 1.5)).toThrow(InvalidAlertCondition);
  });
});

describe('Grupo 4 — Alert entity', () => {
  it('creates with correct fields', () => {
    const condition = priceBelow(price);
    const alert = new Alert('a1', 'u1', productUrl, condition, true, null);
    expect(alert.id).toBe('a1');
    expect(alert.userId).toBe('u1');
    expect(alert.active).toBe(true);
    expect(alert.lastTriggeredAt).toBeNull();
  });

  it('id and userId are primitive string (not String)', () => {
    const alert = new Alert('a1', 'u1', productUrl, priceBelow(price), true, null);
    expect(typeof alert.id).toBe('string');
    expect(typeof alert.userId).toBe('string');
  });

  it('empty productUrl throws InvalidProductUrl', () => {
    expect(() => new Alert('a1', 'u1', '', priceBelow(price), true, null)).toThrow(InvalidProductUrl);
  });

  it('trigger() returns new immutable instance with lastTriggeredAt set', () => {
    const alert = new Alert('a1', 'u1', productUrl, priceBelow(price), true, null);
    const at = new Date();
    const triggered = alert.trigger(at);
    expect(triggered.lastTriggeredAt).toBe(at);
    expect(triggered.id).toBe(alert.id);
    expect(triggered.userId).toBe(alert.userId);
    expect(alert.lastTriggeredAt).toBeNull(); // original unchanged
  });
});

describe('Grupo 4 — AlertCreation', () => {
  it('creates alert with active===true and lastTriggeredAt===null', async () => {
    const repo = new FakeAlertRepo();
    const uc = new AlertCreation(repo);
    const condition = priceBelow(price);
    const alert = await uc.create({ userId: 'u1', productUrl, condition });
    expect(alert.active).toBe(true);
    expect(alert.lastTriggeredAt).toBeNull();
    expect(repo.saved.length).toBe(1);
  });

  it('two calls produce different ids', async () => {
    const repo = new FakeAlertRepo();
    const uc = new AlertCreation(repo);
    const condition = priceBelow(price);
    const a1 = await uc.create({ userId: 'u1', productUrl, condition });
    const a2 = await uc.create({ userId: 'u1', productUrl, condition });
    expect(a1.id).not.toBe(a2.id);
  });
});

describe('Grupo 4 — AlertListing', () => {
  it('lists alerts for a specific user', async () => {
    const alerts = [
      makeAlert('a1', 'user-1'),
      makeAlert('a2', 'user-1'),
      makeAlert('a3', 'user-2'),
    ];
    const repo = new FakeAlertRepo(alerts);
    const uc = new AlertListing(repo);
    const result = await uc.list('user-1');
    expect(result.length).toBe(2);
  });

  it('empty list for user with no alerts', async () => {
    const repo = new FakeAlertRepo();
    const uc = new AlertListing(repo);
    const result = await uc.list('user-1');
    expect(result.length).toBe(0);
  });

  it('maps correctly', async () => {
    const alert = makeAlert('a1', 'user-1');
    const repo = new FakeAlertRepo([alert]);
    const uc = new AlertListing(repo);
    const result = await uc.list('user-1');
    expect(result[0]!.id).toBe('a1');
    expect(result[0]!.productUrl).toBe(productUrl);
    expect(result[0]!.active).toBe(true);
    expect(result[0]!.lastTriggeredAt).toBeNull();
  });
});

describe('Grupo 4 — AlertRemoval', () => {
  it('removes an existing alert', async () => {
    const alert = makeAlert('a1', 'u1');
    const repo = new FakeAlertRepo([alert]);
    const uc = new AlertRemoval(repo);
    await uc.remove('a1');
    expect(repo.removed).toContain('a1');
  });

  it('non-existent id throws AlertNotFound', async () => {
    const repo = new FakeAlertRepo();
    const uc = new AlertRemoval(repo);
    await expect(uc.remove('nonexistent')).rejects.toThrow(AlertNotFound);
  });
});

describe('Grupo 4 — PriceBelowEvaluator', () => {
  const evaluator = new PriceBelowEvaluator();
  const historyRepo = new FakeHistoryRepo() as PriceHistoryRepository;

  it('has kind PriceBelow', () => {
    expect(evaluator.kind).toBe('PriceBelow');
  });

  it('snapshot(400) vs threshold(600) returns true', async () => {
    const snap = makeSnapshot(new Money(400, 'MXN'));
    const condition = priceBelow(new Money(600, 'MXN'));
    expect(await evaluator.matches(condition, snap, historyRepo)).toBe(true);
  });

  it('snapshot(400) vs threshold(400) returns false (strictly below)', async () => {
    const snap = makeSnapshot(new Money(400, 'MXN'));
    const condition = priceBelow(new Money(400, 'MXN'));
    expect(await evaluator.matches(condition, snap, historyRepo)).toBe(false);
  });

  it('snapshot(500) vs threshold(300) returns false', async () => {
    const snap = makeSnapshot(new Money(500, 'MXN'));
    const condition = priceBelow(new Money(300, 'MXN'));
    expect(await evaluator.matches(condition, snap, historyRepo)).toBe(false);
  });

  it('priceAtMin condition returns false', async () => {
    const snap = makeSnapshot(new Money(400, 'MXN'));
    const condition = priceAtMin(7);
    expect(await evaluator.matches(condition, snap, historyRepo)).toBe(false);
  });
});

describe('Grupo 4 — PriceAtMinEvaluator', () => {
  const evaluator = new PriceAtMinEvaluator();

  it('has kind PriceAtMin', () => {
    expect(evaluator.kind).toBe('PriceAtMin');
  });

  it('snapshot(400) histMin(400) returns true', async () => {
    const snap = makeSnapshot(new Money(400, 'MXN'));
    const historyRepo = new FakeHistoryRepo(new Map(), new Map(), new Map([[productUrl, new Money(400, 'MXN')]]));
    const condition = priceAtMin(7);
    expect(await evaluator.matches(condition, snap, historyRepo)).toBe(true);
  });

  it('snapshot(400) histMin(300) returns false', async () => {
    const snap = makeSnapshot(new Money(400, 'MXN'));
    const historyRepo = new FakeHistoryRepo(new Map(), new Map(), new Map([[productUrl, new Money(300, 'MXN')]]));
    const condition = priceAtMin(7);
    expect(await evaluator.matches(condition, snap, historyRepo)).toBe(false);
  });

  it('histMin null returns false', async () => {
    const snap = makeSnapshot(new Money(400, 'MXN'));
    const historyRepo = new FakeHistoryRepo();
    const condition = priceAtMin(7);
    expect(await evaluator.matches(condition, snap, historyRepo)).toBe(false);
  });

  it('priceBelow condition returns false', async () => {
    const snap = makeSnapshot(new Money(400, 'MXN'));
    const historyRepo = new FakeHistoryRepo();
    const condition = priceBelow(new Money(500, 'MXN'));
    expect(await evaluator.matches(condition, snap, historyRepo)).toBe(false);
  });
});

describe('Grupo 4 — PriceDropPctEvaluator', () => {
  const evaluator = new PriceDropPctEvaluator();

  function makeHistory(prices: number[]): PriceSnapshot[] {
    return prices.map((p, i) => new PriceSnapshot(`s${i}`, productUrl, 'amazon', new Money(p, 'MXN'), new Date()));
  }

  it('has kind PriceDropPct', () => {
    expect(evaluator.kind).toBe('PriceDropPct');
  });

  it('history=[1000, 800], current=800, required=20% returns true', async () => {
    const snap = makeSnapshot(new Money(800, 'MXN'));
    const history = makeHistory([1000, 800]);
    const historyRepo = new FakeHistoryRepo(new Map(), new Map([[productUrl, history]]));
    const condition = priceDropPct(20, 7);
    expect(await evaluator.matches(condition, snap, historyRepo)).toBe(true);
  });

  it('history=[1000, 700], current=700, required=20% returns true', async () => {
    const snap = makeSnapshot(new Money(700, 'MXN'));
    const history = makeHistory([1000, 700]);
    const historyRepo = new FakeHistoryRepo(new Map(), new Map([[productUrl, history]]));
    const condition = priceDropPct(20, 7);
    expect(await evaluator.matches(condition, snap, historyRepo)).toBe(true);
  });

  it('history=[1000, 950], current=950, required=20% returns false', async () => {
    const snap = makeSnapshot(new Money(950, 'MXN'));
    const history = makeHistory([1000, 950]);
    const historyRepo = new FakeHistoryRepo(new Map(), new Map([[productUrl, history]]));
    const condition = priceDropPct(20, 7);
    expect(await evaluator.matches(condition, snap, historyRepo)).toBe(false);
  });

  it('1 snapshot returns false', async () => {
    const snap = makeSnapshot(new Money(800, 'MXN'));
    const history = makeHistory([1000]);
    const historyRepo = new FakeHistoryRepo(new Map(), new Map([[productUrl, history]]));
    const condition = priceDropPct(20, 7);
    expect(await evaluator.matches(condition, snap, historyRepo)).toBe(false);
  });

  it('0 snapshots returns false', async () => {
    const snap = makeSnapshot(new Money(800, 'MXN'));
    const historyRepo = new FakeHistoryRepo();
    const condition = priceDropPct(20, 7);
    expect(await evaluator.matches(condition, snap, historyRepo)).toBe(false);
  });

  it('priceAtMin condition returns false', async () => {
    const snap = makeSnapshot(new Money(800, 'MXN'));
    const historyRepo = new FakeHistoryRepo();
    const condition = priceAtMin(7);
    expect(await evaluator.matches(condition, snap, historyRepo)).toBe(false);
  });
});

describe('Grupo 4 — AlertEvaluation', () => {
  it('condition matches - notifier called and alert saved with lastTriggeredAt', async () => {
    const user = makeUser();
    const alert = makeAlert('a1', 'user-1');
    const snap = makeSnapshot(new Money(400, 'MXN')); // below 600 threshold

    const alertRepo = new FakeAlertRepo([alert]);
    const historyRepo = new FakeHistoryRepo(new Map([[productUrl, snap]]));
    const userRepo = new FakeUserRepo([user]);
    const notifier = new FakeNotifier();

    const evaluatorMap = new Map<AlertCondition['kind'], AlertConditionEvaluator>([
      ['PriceBelow', new PriceBelowEvaluator()],
    ]);

    const uc = new AlertEvaluation(alertRepo, historyRepo, userRepo, notifier, evaluatorMap);
    await uc.evaluate();

    expect(notifier.calls.length).toBe(1);
    expect(alertRepo.saved[0]!.lastTriggeredAt).not.toBeNull();
  });

  it('condition does not match - notifier NOT called', async () => {
    const user = makeUser();
    const alert = makeAlert('a1', 'user-1');
    const snap = makeSnapshot(new Money(700, 'MXN')); // above 600 threshold

    const alertRepo = new FakeAlertRepo([alert]);
    const historyRepo = new FakeHistoryRepo(new Map([[productUrl, snap]]));
    const userRepo = new FakeUserRepo([user]);
    const notifier = new FakeNotifier();

    const evaluatorMap = new Map<AlertCondition['kind'], AlertConditionEvaluator>([
      ['PriceBelow', new PriceBelowEvaluator()],
    ]);

    const uc = new AlertEvaluation(alertRepo, historyRepo, userRepo, notifier, evaluatorMap);
    await uc.evaluate();

    expect(notifier.calls.length).toBe(0);
  });

  it('no latest snapshot - notifier NOT called', async () => {
    const user = makeUser();
    const alert = makeAlert('a1', 'user-1');

    const alertRepo = new FakeAlertRepo([alert]);
    const historyRepo = new FakeHistoryRepo();
    const userRepo = new FakeUserRepo([user]);
    const notifier = new FakeNotifier();

    const evaluatorMap = new Map<AlertCondition['kind'], AlertConditionEvaluator>([
      ['PriceBelow', new PriceBelowEvaluator()],
    ]);

    const uc = new AlertEvaluation(alertRepo, historyRepo, userRepo, notifier, evaluatorMap);
    await uc.evaluate();

    expect(notifier.calls.length).toBe(0);
  });

  it('user not found - notifier NOT called', async () => {
    const alert = makeAlert('a1', 'user-1');
    const snap = makeSnapshot(new Money(400, 'MXN'));

    const alertRepo = new FakeAlertRepo([alert]);
    const historyRepo = new FakeHistoryRepo(new Map([[productUrl, snap]]));
    const userRepo = new FakeUserRepo(); // empty - no users
    const notifier = new FakeNotifier();

    const evaluatorMap = new Map<AlertCondition['kind'], AlertConditionEvaluator>([
      ['PriceBelow', new PriceBelowEvaluator()],
    ]);

    const uc = new AlertEvaluation(alertRepo, historyRepo, userRepo, notifier, evaluatorMap);
    await uc.evaluate();

    expect(notifier.calls.length).toBe(0);
  });

  it('one throws but continues - 2 alerts evaluated, no throw from evaluate()', async () => {
    const user = makeUser();
    const alert1 = makeAlert('a1', 'user-1');
    const alert2 = makeAlert('a2', 'user-1');
    const alert3 = makeAlert('a3', 'user-1');

    const snap = makeSnapshot(new Money(400, 'MXN'));
    const alertRepo = new FakeAlertRepo([alert1, alert2, alert3]);

    let callCount = 0;
    const historyRepo: PriceHistoryRepository = {
      async saveSnapshot() {},
      async getLatest(url) {
        callCount++;
        if (callCount === 2) throw new Error('history failure');
        return snap;
      },
      async getHistory() { return []; },
      async getMin() { return null; },
    };
    const userRepo = new FakeUserRepo([user]);
    const notifier = new FakeNotifier();

    const evaluatorMap = new Map<AlertCondition['kind'], AlertConditionEvaluator>([
      ['PriceBelow', new PriceBelowEvaluator()],
    ]);

    const uc = new AlertEvaluation(alertRepo, historyRepo, userRepo, notifier, evaluatorMap);
    await expect(uc.evaluate()).resolves.not.toThrow();
    expect(notifier.calls.length).toBe(2);
  });
});
