import { Transaction } from '../models.js';
import { ExchangeRateService } from '../services/ExchangeRateService.js';
import { AuditStrategy } from './AuditStrategy.js';

export class MultiCurrencyStrategy implements AuditStrategy {
  public readonly name = 'Multi-Currency Auditor';
  public readonly description =
    'Converts and aggregates transactions in a foreign currency';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {

    // TODO: Feature 5 - Implement this strategy.
    // 1. Call ExchangeRateService.getExchangeRates() asynchronously.
    // Fetch the exchange rates instance from the service.
    const exchangeRateService = new  ExchangeRateService();
    // 
    const rates = await exchangeRateService.getExchangeRates();

    // Helper function to determine the target currency.
    function getTargetCurrency(
      customParam?: string,
      exchangeRates: Record<string, number> = {},
    ): string {
      // Check if the custom parameter is a valid currency in the exchange rates.
      if (customParam && customParam in exchangeRates) {
        return customParam;
      }
      // Fallback to default currency if custom parameter is invalid or not provided.
      return 'EUR';
    }

    // 2. Identify the target currency from `customParam` (default to 'EUR' if invalid/not provided).
    const targetCurrency = getTargetCurrency(customParam, rates);

    // 3. Look up the exchange rate for the target currency (throw an error if not found in rates).
    // Look up the exchange rate for the target currency.
    const targetExchangeRate = rates[targetCurrency];
    // Check if the exchange rate for the target currency exists.
    if (!targetExchangeRate) {
      throw new Error('Exchange rate for target currency not found');
    }

    // 4. Convert all transaction amounts to the target currency.
    const convertedTransactions = transactions.map(transaction => ({
      ...transaction,
      amountInTargetCurrency: transaction.amount * targetExchangeRate,
    }));
   
    // 5. Calculate total income, total expenses, and net balance in BOTH USD and target currency.
    
    // Calculate totals in USD and target currency.
    const IncomeUSD = transactions.filter(transaction => transaction.amount > 0).reduce((sum, transaction) => sum + transaction.amount, 0);
    // Calculate total expenses in USD.
    const ExpensesUSD = transactions.filter(transaction => transaction.amount < 0).reduce((sum, transaction) => sum + transaction.amount, 0);
    // Calculate net balance in USD.
    const NetBalanceUSD = IncomeUSD + ExpensesUSD;
    
    // Calculate totals in target currency.
    const IncomeTarget = convertedTransactions.filter(transaction => transaction.amountInTargetCurrency > 0).reduce((sum, transaction) => sum + transaction.amountInTargetCurrency, 0);
    // Calculate total expenses in target currency.
    const ExpensesTarget = convertedTransactions.filter(transaction => transaction.amountInTargetCurrency < 0).reduce((sum, transaction) => sum + transaction.amountInTargetCurrency, 0);
    // Calculate net balance in target currency.
    const NetBalanceTarget = IncomeTarget + ExpensesTarget;
    
    
    // 6. Format and return a text-based audit report detailing conversion metrics, conversion rate used, and transaction summaries in both currencies.
    return `Multi-Currency Audit Report
    Target Currency: ${targetCurrency}
    Exchange Rate: ${targetExchangeRate}

    USD Summary:
    Total Income: ${IncomeUSD.toFixed(2)}
    Total Expenses: ${ExpensesUSD.toFixed(2)}
    Net Balance: ${NetBalanceUSD.toFixed(2)}

    ${targetCurrency} Summary:
    Total Income: ${IncomeTarget.toFixed(2)}
    Total Expenses: ${ExpensesTarget.toFixed(2)}
    Net Balance: ${NetBalanceTarget.toFixed(2)}
    `;
  }
}
