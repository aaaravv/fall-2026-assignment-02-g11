import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnomalyDetectionStrategy } from '../src/strategies/AnomalyDetectionStrategy.js';
import { AnomalyRulesService } from '../src/services/AnomalyRulesService.js';
import { Transaction } from '../src/models.js';

describe('AnomalyDetectionStrategy (Feature 2)', () => {
  let strategy: AnomalyDetectionStrategy;

  beforeEach(() => {
    strategy = new AnomalyDetectionStrategy();
    vi.restoreAllMocks();
  });

  // Example of how to write and mock in your tests:
  //
  // it('should detect outlier transactions exceeding threshold', async () => {
  //   const mockRules = { maxTransactionAmount: 500.00, flaggedStatuses: ['flagged'] };
  //   const spy = vi.spyOn(AnomalyRulesService, 'getRules').mockResolvedValue(mockRules);
  //
  //   const testTransactions: Transaction[] = [
  //     { id: '1', date: '2026-05-01', amount: -600.00, category: 'Shopping', description: 'Laptop', status: 'completed' }, // Outlier
  //     { id: '2', date: '2026-05-02', amount: -100.00, category: 'Food', description: 'Grocery', status: 'completed' }, // Normal
  //   ];
  //
  //   const result = await strategy.execute(testTransactions);
  //
  //   expect(spy).toHaveBeenCalled();
  //   expect(result).toContain('Laptop');
  //   expect(result).toContain('Outlier');
  // });

  it('should detect outlier transactions exceeding the configured max amount limit', async () => {
    const mockRules = {
      maxTransactionAmount: 500.0,
      flaggedStatuses: ['flagged'],
    };
    const spy = vi
      .spyOn(AnomalyRulesService, 'getRules')
      .mockResolvedValue(mockRules);

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -600.0,
        category: 'Shopping',
        description: 'Laptop',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -100.0,
        category: 'Food',
        description: 'Grocery',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toContain('[1] 2026-05-01 | Shopping | Laptop | $-600');
    expect(result).not.toContain('[2]');
  });

  it('should identify duplicate transactions sharing identical date, amount, category, and description', async () => {
    const mockRules = {
      maxTransactionAmount: 1000.0,
      flaggedStatuses: ['flagged'],
    };
    vi.spyOn(AnomalyRulesService, 'getRules').mockResolvedValue(mockRules);

    const testTransactions: Transaction[] = [
      {
        id: 'dup1',
        date: '2026-05-10',
        amount: -50.0,
        category: 'Dining',
        description: 'Coffee Shop',
        status: 'completed',
      },
      {
        id: 'dup2',
        date: '2026-05-10',
        amount: -50.0,
        category: 'Dining',
        description: 'Coffee Shop',
        status: 'completed',
      },
      {
        id: 'unique1',
        date: '2026-05-11',
        amount: -30.0,
        category: 'Dining',
        description: 'Lunch Place',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('DUPLICATE TRANSACTION SETS');
    expect(result).toContain('Set 1:');
    expect(result).toContain('[dup1]');
    expect(result).toContain('[dup2]');
    expect(result).not.toContain('[unique1]');
  });

  it('should flag transactions matching standard flagged statuses in the rules', async () => {
    const mockRules = {
      maxTransactionAmount: 1000.0,
      flaggedStatuses: ['flagged', 'suspended'],
    };
    vi.spyOn(AnomalyRulesService, 'getRules').mockResolvedValue(mockRules);

    const testTransactions: Transaction[] = [
      {
        id: 'flag1',
        date: '2026-05-15',
        amount: -200.0,
        category: 'Services',
        description: 'Wire Transfer',
        status: 'flagged',
      },
      {
        id: 'flag2',
        date: '2026-05-16',
        amount: -150.0,
        category: 'Services',
        description: 'Consulting',
        status: 'suspended',
      },
      {
        id: 'normal1',
        date: '2026-05-17',
        amount: -80.0,
        category: 'Utilities',
        description: 'Electric Bill',
        status: 'cleared',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('FLAGGED STATUS TRANSACTIONS');
    expect(result).toContain('[flag1]');
    expect(result).toContain('[flag2]');
    expect(result).not.toContain('[normal1]');
  });

  it('should calculate correct transaction anomaly rates and total flagged valuation', async () => {
    const mockRules = {
      maxTransactionAmount: 500.0,
      flaggedStatuses: ['flagged'],
    };
    vi.spyOn(AnomalyRulesService, 'getRules').mockResolvedValue(mockRules);

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -1000.0,
        category: 'Tech',
        description: 'Monitor',
        status: 'completed',
      }, // Outlier
      {
        id: '2',
        date: '2026-05-02',
        amount: -100.0,
        category: 'Food',
        description: 'Dinner',
        status: 'flagged',
      }, // Flagged
      {
        id: '3',
        date: '2026-05-03',
        amount: -50.0,
        category: 'Travel',
        description: 'Taxi',
        status: 'completed',
      }, // Normal
      {
        id: '4',
        date: '2026-05-04',
        amount: -20.0,
        category: 'Books',
        description: 'Novel',
        status: 'completed',
      }, // Normal
    ];

    const result = await strategy.execute(testTransactions);

    // 2 anomalies out of 4 total transactions = 50.00%
    expect(result).toContain(
      'Summary: Total Transactions: 4 | Anomalous: 2 (50.00%)',
    );
  });

  it('should output a clean, readable text audit report detailing warnings', async () => {
    const mockRules = {
      maxTransactionAmount: 500.0,
      flaggedStatuses: ['flagged'],
    };
    vi.spyOn(AnomalyRulesService, 'getRules').mockResolvedValue(mockRules);

    const result = await strategy.execute([]);

    expect(result).toContain('Anomaly & Duplicate Auditor Report');
    expect(result).toContain(
      'Total Transactions: 0 | Anomalous Transactions: 0 (0.00%)',
    );
    expect(result).toContain('No transactions to analyze.');
  });
});