import { Transaction } from '../models.js';
import { BudgetService } from '../services/BudgetService.js';
import { AuditStrategy } from './AuditStrategy.js';

export class BudgetLimitStrategy implements AuditStrategy {
  public readonly name = 'Budget Limit Auditor';
  public readonly description =
    'Checks category spending against monthly budget limits';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {
    // TODO: Feature 1 - Implement this strategy.

    // 1. Call BudgetService.getCategoryBudgets() asynchronously.
    const categoryBudgets = await BudgetService.getCategoryBudgets(); // Fetches budget data for each category

    // 2. Group expenses (amounts < 0) by category and compute total spending for each category.
    const categorySpending = transactions
      .filter((t) => t.amount < 0) // Filters transactions to include expenses (negative amounts = <0), t is one transaction
      .reduce(
        (acc, t) => {
          // Reduces filtered transactions to compute total spending per category, acc is an accumulator object that holds the total spending for each category
          acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount); // Adds absolute value of transaction amount to the corresponding category in the accumulator object, initializing it to 0 if it doesn't exist yet
          return acc;
        },
        {} as Record<string, number>,
      ); // Returns acc as string, number object, where string is category name and number is total spending for category

    // 3. Compare spending against the fetched limits.
    async function compareSpendingToLimits() {
      const overages: Record<string, { limit: number; spent: number }> = {}; // Overages will hold categories where spending is greater than budget limit
      for (const category in categoryBudgets) {
        const limit = categoryBudgets[category];
        const spent = categorySpending[category] || 0;
        if (spent > limit) {
          overages[category] = { limit, spent }; // If spending greater than limit, overage category is logged with limit and spent amount
        }
      }
      return overages;
    }
    // 4. Identify overages (categories where spending exceeds the budget).
    const overages = await compareSpendingToLimits();

    // 5. Format and return a text-based audit report outlining limits, actuals, overage amounts, percentages, and lists of transactions causing the overage.
    const reportLines: string[] = ['Budget Limit Audit Report'];

    for (const category in overages) {
      // For const ??????
      const { limit, spent } = overages[category];
      const overage = spent - limit;
      const percentage = (overage / limit) * 100;
      const categoryTransactions = transactions.filter(
        (t) => t.category === category && t.amount < 0,
      );

      reportLines.push(
        `Category: ${category}`,
        `Budget Limit: $${limit.toFixed(2)}`,
        `Actual Spending: $${spent.toFixed(2)}`,
        `Overage: $${overage.toFixed(2)}`,
        `Precentage over budget: $${percentage.toFixed(2)}%`,
        `Transactions causing overage: `,
      );

      for (const transaction of categoryTransactions) {
        reportLines.push(
          `- ${transaction.description}: $${Math.abs(transaction.amount).toFixed(2)}`,
        );
      }
    }

    // throw new Error('Method not implemented.');
    return reportLines.join('\n');
  }
}