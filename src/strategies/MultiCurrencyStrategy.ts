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
    
    // Fetch the latest exchange rates asynchronously.
    const exchangeData = await ExchangeRateService.getExchangeRates();
    const exchangeRates = exchangeData.rates;
    
    // 2. Identify the target currency from `customParam` (default to 'EUR' if invalid/not provided).
    
    // Clear user input and normalize the customParam (in uppercase)
    const cleanTarget = customParam && customParam.trim() !== '' ? customParam.trim().toUpperCase() : 'EUR';
    // Determine the target currency based on the cleaned input and available exchange rates.
    const targetCurrency = cleanTarget in exchangeRates ? cleanTarget : 'EUR';

    // 3. Look up the exchange rate for the target currency (throw an error if not found in rates).
    
    // Look up the exchange rate for the target currency.
    const targetExchangeRate = exchangeRates[targetCurrency];
    // Check if the exchange rate for the target currency exists.
    if (targetExchangeRate == undefined  || typeof targetExchangeRate !== 'number') {
      throw new Error('Exchange rate for target currency not found');
    }

    // 4. Convert all transaction amounts to the target currency.
    
    // Iterate through each transaction(array) and convert the amount to the target currency.
    const convertedTransactions = transactions.map(trans => ({
      ...trans,
      amountInTargetCurrency: trans.amount * targetExchangeRate,
    }));
   
    // 5. Calculate total income, total expenses, and net balance in BOTH USD and target currency.
    
    // Calculate totals in USD and target currency.
    const IncomeUSD = transactions.filter(trans => trans.amount > 0).reduce((sum, trans) => sum + trans.amount, 0);
    // Calculate total expenses in USD.
    const ExpensesUSD = transactions.filter(trans => trans.amount < 0).reduce((sum, trans) => sum + trans.amount, 0);
    // Calculate net balance in USD.
    const NetBalanceUSD = IncomeUSD + ExpensesUSD;
    
    // Calculate totals in target currency.
    const IncomeTarget = convertedTransactions.filter(trans => trans.amountInTargetCurrency > 0).reduce((sum, trans) => sum + trans.amountInTargetCurrency, 0);
    // Calculate total expenses in target currency.
    const ExpensesTarget = convertedTransactions.filter(trans => trans.amountInTargetCurrency < 0).reduce((sum, trans) => sum + trans.amountInTargetCurrency, 0);
    // Calculate net balance in target currency.
    const NetBalanceTarget = IncomeTarget + ExpensesTarget;
    
    
    // 6. Format and return a text-based audit report detailing conversion metrics, conversion rate used, and transaction summaries in both currencies.
    return `Multi-Currency Audit Report
    Target Currency: ${targetCurrency}
    Exchange Rate: ${targetExchangeRate}

    USD Summary:
    Total Income: ${IncomeUSD.toFixed(2)}
    Total Expense: ${ExpensesUSD.toFixed(2)}
    Net Balance: ${NetBalanceUSD.toFixed(2)}

    ${targetCurrency} Summary:
    Total Income: ${IncomeTarget.toFixed(2)}
    Total Expense: ${ExpensesTarget.toFixed(2)}
    Net Balance: ${NetBalanceTarget.toFixed(2)}
    `;
  }
}
