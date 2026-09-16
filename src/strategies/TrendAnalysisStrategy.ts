import { Transaction } from '../models.js';
import { HistoricalDataService } from '../services/HistoricalDataService.js';
import { AuditStrategy } from './AuditStrategy.js';

export class TrendAnalysisStrategy implements AuditStrategy {
  public readonly name = 'Historical Trend Auditor';
  public readonly description =
    'Compares current monthly category spending against historical averages';

  public async execute(
    transactions: Transaction[],
    _customParam?: string,
  ): Promise<string> {
    // 1. Fetch the historical monthly averages asynchronously.
    const historicalAverages =
      await HistoricalDataService.getHistoricalAverages();

    // 2. Group current expenses by category and calculate their totals.
    const categoryTotals: Record<string, number> = {};

    for (const transaction of transactions) {
      if (transaction.amount < 0) {
        categoryTotals[transaction.category] =
          (categoryTotals[transaction.category] ?? 0) +
          Math.abs(transaction.amount);
      }
    }

    // Include categories found in either the historical data or current data.
    const categories = Array.from(
      new Set([
        ...Object.keys(historicalAverages),
        ...Object.keys(categoryTotals),
      ]),
    ).sort();

    const comparisonRows: string[] = [];
    const growthCategories: string[] = [];
    const savingsCategories: string[] = [];

    // 3-5. Compare totals, calculate variance, and identify large changes.
    for (const category of categories) {
      const current = categoryTotals[category] ?? 0;
      const historical = historicalAverages[category] ?? 0;

      let variance: number | null = null;

      if (historical > 0) {
        variance = ((current - historical) / historical) * 100;
      } else if (current === 0) {
        variance = 0;
      }

      const varianceText =
        variance === null
          ? 'N/A'
          : `${variance > 0 ? '+' : ''}${variance.toFixed(1)}%`;

      comparisonRows.push(
        `${category} | $${current.toFixed(2)} | ` +
          `$${historical.toFixed(2)} | ${varianceText}`,
      );

      if (variance !== null && variance > 20) {
        growthCategories.push(`${category}: ${varianceText}`);
      }

      if (variance !== null && variance < -20) {
        savingsCategories.push(`${category}: ${varianceText}`);
      }
    }

    // 6. Format and return the text-based audit report.
    return [
      'HISTORICAL TREND AUDIT REPORT',
      '',
      'CURRENT SPENDING VS. HISTORICAL AVERAGE',
      'Category | Current Spending | Historical Average | Change',
      ...(comparisonRows.length > 0
        ? comparisonRows
        : ['No categories available.']),
      '',
      'SIGNIFICANT GROWTH CATEGORIES',
      ...(growthCategories.length > 0 ? growthCategories : ['None']),
      '',
      'SIGNIFICANT SAVINGS CATEGORIES',
      ...(savingsCategories.length > 0 ? savingsCategories : ['None']),
    ].join('\n');
  }
}