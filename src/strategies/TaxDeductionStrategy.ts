import { TaxConfig, Transaction } from '../models.js';
import { TaxConfigService } from '../services/TaxConfigService.js';
import { AuditStrategy } from './AuditStrategy.js';

export class TaxDeductionStrategy implements AuditStrategy {
  public readonly name = 'Tax & Deductions Auditor';
  public readonly description =
    'Identifies eligible tax-deductible expenses and estimates savings';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {
    // TODO: Feature 4 - Implement this strategy.
    // 1. Call TaxConfigService.getTaxConfig() asynchronously.
    let config: TaxConfig = await TaxConfigService.getTaxConfig();
    // 2. Filter expenses (amount < 0) that belong to eligible tax-deductible categories.
    let eligible_arr: Transaction[] = transactions.filter((action) => action.amount < 0 && config.deductibleCategories.includes(action.category));
    let in_eligible_arr: Transaction[] = transactions.filter((action) => action.amount >= 0 || !config.deductibleCategories.includes(action.category));
 
    // 3. Sum total deductible expenses.
    let total_deductible = eligible_arr.reduce((sum, action) => sum + Math.abs(action.amount), 0);
    let taxed_transactions = in_eligible_arr.reduce((sum, action) => sum + Math.abs(action.amount), 0);

    // 4. Estimate tax savings based on the standard tax rate: total deductible * taxRate.
    let savings = total_deductible * config.standardTaxRate;
    // 5. Estimate sales tax/VAT paid on NON-deductible expenses using standard tax rate.
    let tax = taxed_transactions * config.standardTaxRate;
    // 6. Format and return a text-based audit report detailing total deductions, savings, VAT estimates, and eligible transactions.
    let report = "";

    report += `Eligible Transctions:\n=====================\n`;
    eligible_arr.forEach((exp) => report += `ID:  ${exp.id}, Amount: $${Math.abs(exp.amount)}\n`);
    
    return report;
  }
}
