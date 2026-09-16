import { Transaction } from '../models.js';
import { AnomalyRulesService } from '../services/AnomalyRulesService.js';
import { AuditStrategy } from './AuditStrategy.js';

export class AnomalyDetectionStrategy implements AuditStrategy {
  public readonly name = 'Anomaly & Duplicate Auditor';
  public readonly description =
    'Detects transactions exceeding thresholds and duplicate records';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {
    // 1. Call AnomalyRulesService.getRules() asynchronously.
    const rules = await AnomalyRulesService.getRules();

    if (transactions.length === 0) {
      return [
        `${this.name} Report`,
        'Total Transactions: 0 | Anomalous Transactions: 0 (0.00%)',
        'No transactions to analyze.',
      ].join('\n');
    }

    // 2. Scan transactions to find outliers (expenses exceeding rules.maxTransactionAmount).
    const outliers = transactions.filter(
      (t) => Math.abs(t.amount) > rules.maxTransactionAmount,
    );

    // 3. Scan to identify duplicates (transactions sharing the exact same date, category, description, and amount).
    const groups = new Map<string, Transaction[]>();
    for (const t of transactions) {
      const key = `${t.date}_${t.category}_${t.description}_${t.amount}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(t);
    }

    const duplicateSets: Transaction[][] = [];
    for (const group of groups.values()) {
      if (group.length > 1) {
        duplicateSets.push(group);
      }
    }

    // 4. Identify transactions having a status that matches any in rules.flaggedStatuses.
    const flagged = transactions.filter((t) =>
      rules.flaggedStatuses.includes(t.status),
    );

    // 5. Calculate total flagged value and anomaly rates.
    const anomalousIds = new Set<string>();
    outliers.forEach((t) => anomalousIds.add(t.id));
    flagged.forEach((t) => anomalousIds.add(t.id));
    duplicateSets.flat().forEach((t) => anomalousIds.add(t.id));

    const totalAnomalies = anomalousIds.size;
    const percentage = ((totalAnomalies / transactions.length) * 100).toFixed(2);

    // 6. Format and return a text-based audit report of anomalies, duplicate sets, and totals.
    const reportLines: string[] = [
      `${this.name} Report`,
      `Summary: Total Transactions: ${transactions.length} | Anomalous: ${totalAnomalies} (${percentage}%)`,
      '',
      `OUTLIER TRANSACTIONS (Exceeding $${rules.maxTransactionAmount})`,
    ];

    if (outliers.length === 0) {
      reportLines.push('None found.');
    } else {
      outliers.forEach((t) => {
        reportLines.push(`[${t.id}] ${t.date} | ${t.category} | ${t.description} | $${t.amount}`);
      });
    }

    reportLines.push('', 'DUPLICATE TRANSACTION SETS');
    if (duplicateSets.length === 0) {
      reportLines.push('None found.');
    } else {
      duplicateSets.forEach((set, idx) => {
        reportLines.push(`Set ${idx + 1}:`);
        set.forEach((t) => {
          reportLines.push(`  - [${t.id}] ${t.date} | ${t.category} | ${t.description} | $${t.amount}`);
        });
      });
    }

    reportLines.push('', 'FLAGGED STATUS TRANSACTIONS');
    if (flagged.length === 0) {
      reportLines.push('None found.');
    } else {
      flagged.forEach((t) => {
        reportLines.push(`[${t.id}] ${t.date} | Status: ${t.status} | ${t.description} | $${t.amount}`);
      });
    }

    return reportLines.join('\n');
  }
}