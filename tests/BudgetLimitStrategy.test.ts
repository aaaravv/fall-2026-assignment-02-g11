import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetLimitStrategy } from '../src/strategies/BudgetLimitStrategy.js';
import { BudgetService } from '../src/services/BudgetService.js';
import { Transaction } from '../src/models.js';

describe('BudgetLimitStrategy (Feature 1)', () => {
  let strategy: BudgetLimitStrategy;

  // const testTransactions: Transaction[] = [ // Test transactions
  //   {
  //     id: '1',
  //     date: '2026-05-01',
  //     amount: -150.00,
  //     category: 'Food',
  //     description: 'Grocery',
  //     status: 'completed'
  //   },

  //   {
  //     id: '2',
  //     date: '2026-05-02',
  //     amount: -900.00,
  //     category: 'Rent',
  //     description: 'Apartment',
  //     status: 'completed'
  //   },
  // ];

  beforeEach(() => {
    strategy = new BudgetLimitStrategy();
    vi.restoreAllMocks();
  });

  // Example of how to write and mock in your tests:
  //
  // it('should correctly identify categories that are over budget', async () => {
  //   // 1. Mock the BudgetService asynchronously
  //   const mockBudgets = { Food: 100, Rent: 1000 };
  //   const spy = vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(mockBudgets);
  //
  //   // 2. Set up test transactions
  //   const testTransactions: Transaction[] = [
  //     { id: '1', date: '2026-05-01', amount: -150.00, category: 'Food', description: 'Grocery', status: 'completed' }, // Over budget
  //     { id: '2', date: '2026-05-02', amount: -900.00, category: 'Rent', description: 'Apartment', status: 'completed' }, // Under budget
  //   ];
  //
  //   // 3. Execute
  //   const result = await strategy.execute(testTransactions);
  //
  //   // 4. Assert
  //   expect(spy).toHaveBeenCalled();
  //   expect(result).toContain('Food');
  //   expect(result).toContain('OVER BUDGET'); // or whatever formatting you choose
  //   expect(result).not.toContain('Rent over budget');
  // });

  // it.todo('should group expenses correctly by category and sum them');
  it('should group expenses correctly by category and sum them', async () => {
    const mockBudgets = { Food: 100, Rent: 1000 };

    vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(
      mockBudgets,
    );

    const testTransactions: Transaction[] = [
      // Test transactions
      {
        id: '1',
        date: '2026-05-01',
        amount: -150.0,
        category: 'Food',
        description: 'Grocery',
        status: 'completed',
      },

      {
        id: '2',
        date: '2026-05-02',
        amount: -900.0,
        category: 'Rent',
        description: 'Apartment',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions); // Execute test strategy

    expect(result).toContain('Food'); // Check if result contains category name
    expect(result).toContain('$150.00'); // Check if result contains total for categories
  });

  // it.todo('should calculate absolute overage amounts and percentage exceeded');
  it('should calculate absolute overage amounts and percentage exceeded', async () => {
    const mockBudgets = { Food: 100 };

    vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(
      mockBudgets,
    );

    const testTransactions: Transaction[] = [
      // Test transaction
      {
        id: '1',
        date: '2026-05-02',
        amount: -5000.0,
        category: 'Food',
        description: 'Grocery',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions); // Execute test strategy

    expect(result).toContain('Food');
    expect(result).toContain('Overage: $4900.00');
    expect(result).toContain('Precentage over budget: $4900.00%'); // Check if result contains percentage over budget
  });

  // it.todo('should list the specific transactions contributing to categories that are over budget',);
  it('should list the specific transactions contributing to categories that are over budget', async () => {
    const mockBudgets = { Food: 100 };

    vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(
      mockBudgets,
    );

    const testTransactions: Transaction[] = [
      // Test transactions
      {
        id: '1',
        date: '2026-05-01',
        amount: -5000.0,
        category: 'Food',
        description: 'Grocery',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions); // Execute test strategy

    expect(result).toContain('Food');
    expect(result).toContain('$5000.00'); // Check if result contains overage amount
  });

  // it.todo('should handle scenarios where no categories are over budget');
  it('should handle scenarios where no categories are over budget', async () => {
    const mockBudgets = { Food: 100, Rent: 1000 };

    vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(
      mockBudgets,
    );

    const testTransactions: Transaction[] = [
      // Test transactions
      {
        id: '1',
        date: '2026-05-01',
        amount: 50.0,
        category: 'Food',
        description: 'Grocery',
        status: 'completed',
      },

      {
        id: '2',
        date: '2026-05-02',
        amount: -900.0,
        category: 'Rent',
        description: 'Apartment',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions); // Execute test strategy

    expect(result).not.toContain('Overage'); // Check if result contains overage amount
    expect(result).toContain('Budget Limit Audit Report'); // Check if result contains report title
  });

  //   it.todo('should handle empty transaction list gracefully');
  //   it('should handle empty transaction list gracefully', async () => {
  //     const mockBudgets = { Food: 100, Rent: 1000 };

  //     vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(mockBudgets);

  //     const result = await strategy.execute([]); // Execute test strategy

  //     expect(result).toContain('No transactions'); // Check if result contains no transactions found message
  //   });
});
