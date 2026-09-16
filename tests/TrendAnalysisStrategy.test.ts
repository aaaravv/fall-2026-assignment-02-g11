import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Transaction } from '../src/models.js';
import { HistoricalDataService } from '../src/services/HistoricalDataService.js';
import { TrendAnalysisStrategy } from '../src/strategies/TrendAnalysisStrategy.js';

describe('TrendAnalysisStrategy (Feature 3)', () => {
  let strategy: TrendAnalysisStrategy;

  beforeEach(() => {
    strategy = new TrendAnalysisStrategy();
    vi.restoreAllMocks();
  });

  it('should group current expenses by category and compute accurate totals', async () => {
    const serviceSpy = vi
      .spyOn(HistoricalDataService, 'getHistoricalAverages')
      .mockResolvedValue({
        Food: 200,
      });

    const transactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -100,
        category: 'Food',
        description: 'Groceries',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -50,
        category: 'Food',
        description: 'Restaurant',
        status: 'completed',
      },
      {
        id: '3',
        date: '2026-05-03',
        amount: 500,
        category: 'Food',
        description: 'Refund or income',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(transactions);

    expect(serviceSpy).toHaveBeenCalledTimes(1);
    expect(result).toContain('Food | $150.00 | $200.00 | -25.0%');
  });

  it('should calculate variance percentage from historical averages correctly', async () => {
    vi.spyOn(
      HistoricalDataService,
      'getHistoricalAverages',
    ).mockResolvedValue({
      Food: 200,
      Rent: 1000,
    });

    const transactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -250,
        category: 'Food',
        description: 'Groceries',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -1000,
        category: 'Rent',
        description: 'Apartment',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(transactions);

    expect(result).toContain('Food | $250.00 | $200.00 | +25.0%');
    expect(result).toContain('Rent | $1000.00 | $1000.00 | 0.0%');
  });

  it('should highlight categories exceeding positive or negative 20 percent variance', async () => {
    vi.spyOn(
      HistoricalDataService,
      'getHistoricalAverages',
    ).mockResolvedValue({
      Food: 200,
      Rent: 1000,
      Utilities: 100,
    });

    const transactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -250,
        category: 'Food',
        description: 'Groceries',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -700,
        category: 'Rent',
        description: 'Apartment',
        status: 'completed',
      },
      {
        id: '3',
        date: '2026-05-03',
        amount: -110,
        category: 'Utilities',
        description: 'Electric bill',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(transactions);

    expect(result).toContain('SIGNIFICANT GROWTH CATEGORIES');
    expect(result).toContain('Food: +25.0%');
    expect(result).toContain('SIGNIFICANT SAVINGS CATEGORIES');
    expect(result).toContain('Rent: -30.0%');
    expect(result).not.toContain('Utilities: +10.0%');
  });

  it('should handle categories missing from historical benchmarks', async () => {
    vi.spyOn(
      HistoricalDataService,
      'getHistoricalAverages',
    ).mockResolvedValue({});

    const transactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -50,
        category: 'Shopping',
        description: 'Clothing',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(transactions);

    expect(result).toContain('Shopping | $50.00 | $0.00 | N/A');
  });

  it('should format an empty current month as a readable report', async () => {
    vi.spyOn(
      HistoricalDataService,
      'getHistoricalAverages',
    ).mockResolvedValue({
      Food: 200,
    });

    const result = await strategy.execute([]);

    expect(result).toContain('HISTORICAL TREND AUDIT REPORT');
    expect(result).toContain(
      'Category | Current Spending | Historical Average | Change',
    );
    expect(result).toContain('Food | $0.00 | $200.00 | -100.0%');
    expect(result).toContain('SIGNIFICANT GROWTH CATEGORIES');
    expect(result).toContain('SIGNIFICANT SAVINGS CATEGORIES');
  });
});