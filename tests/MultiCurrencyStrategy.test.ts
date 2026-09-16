import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MultiCurrencyStrategy } from '../src/strategies/MultiCurrencyStrategy.js';
import { ExchangeRateService } from '../src/services/ExchangeRateService.js';
import { Transaction } from '../src/models.js';

describe('MultiCurrencyStrategy (Feature 5)', () => {
  let strategy: MultiCurrencyStrategy;

  // Create mock exchange rates.
  const mockRates = {
    base: 'USD',
    rates: {
      USD: 1.0,
      EUR: 0.85,
      GBP: 0.75,
    },
  };
  // Sample transactions for testing.
  const sampleTrans: Transaction[] = [
    { id: '1', date: '2026-09-15', amount: 100.00, category: 'Salary', description: 'Paycheck', status: 'completed'},
    { id: '2', date: '2026-09-16', amount: -20.00, category: 'Chickfila', description: 'Hunger', status: 'completed'},
  ];

  beforeEach(() => {
    strategy = new MultiCurrencyStrategy();
    vi.restoreAllMocks();
  });

  // Example of how to write and mock in your tests:
  //
  // it('should convert amounts and sum values in target currency', async () => {
  //   const mockRates = { base: 'USD', rates: { EUR: 0.90 } };
  //   const spy = vi.spyOn(ExchangeRateService, 'getExchangeRates').mockResolvedValue(mockRates);
  //
  //   const testTransactions: Transaction[] = [
  //     { id: '1', date: '2026-05-01', amount: 100.00, category: 'Salary', description: 'Gig', status: 'completed' },
  //     { id: '2', date: '2026-05-02', amount: -50.00, category: 'Food', description: 'Grocery', status: 'completed' },
  //   ];
  //
  //   const result = await strategy.execute(testTransactions, 'EUR');
  //
  //   expect(spy).toHaveBeenCalled();
  //   expect(result).toContain('90.00 EUR'); // 100 * 0.90
  //   expect(result).toContain('-45.00 EUR'); // -50 * 0.90
  //   expect(result).toContain('Balance: 45.00 EUR');
  // });

  it('should parse exchange rates and use customParam target currency', async () => {
    
    //Spy on the ExchangeRateService to mock the getExchangeRates method.
    const spy = vi.spyOn(ExchangeRateService, 'getExchangeRates').mockResolvedValue(mockRates);
    // Execute the strategy with the sample transactions and target currency.
    const res = await strategy.execute(sampleTrans, 'GBP');
    //
    expect(spy).toHaveBeenCalled();
    expect(res).toContain('Target Currency: GBP');
    expect(res).toContain('.75');

  });

  it(
    'should default to EUR conversion if currency param is missing or invalid', async () => {

      vi.spyOn(ExchangeRateService, 'getExchangeRates').mockResolvedValue(mockRates);

      // Parameter is missing/undefined.
      const resMissing = await strategy.execute(sampleTrans);
      expect(resMissing).toContain('Target Currency: EUR');
      // Parameter is invalid/empty string.
      const resInvalid = await strategy.execute(sampleTrans, 'meow');
      expect(resInvalid).toContain('Target Currency: EUR');

    });

  it(
    'should throw an error if the target currency does not exist in exchange rates', async () =>{

      //mock rates missing EUR entirely
      const mockRates = { 
        base: 'USD', 
        rates: { GBP: 0.75 } 
      };

      vi.spyOn(ExchangeRateService, 'getExchangeRates').mockResolvedValue(mockRates);

      await expect(strategy.execute(sampleTrans, 'EUR')).rejects.toThrow();

  });

  it(
    'should accurately convert individual transaction amounts to the target currency', async () => {

      vi.spyOn(ExchangeRateService, 'getExchangeRates').mockResolvedValue(mockRates);

      const res = await strategy.execute(sampleTrans, 'EUR');

      // 100 * 0.85 = 85.00 EUR
      expect(res).toContain('85.00');
      // -20 * 0.85 = -17.00 EUR
      expect(res).toContain('-17.00');

    });

  it(
    'should calculate and display totals (income, expense, net balance) in both USD and target currency', async () => {

      vi.spyOn(ExchangeRateService, 'getExchangeRates').mockResolvedValue(mockRates);

      const res = await strategy.execute(sampleTrans, 'EUR');

      //USD metrics check
      expect(res).toContain('Income: 100.00');
      expect(res).toContain('Expense: -20.00');
      expect(res).toContain('Balance: 80.00');

      //EUR metrics check
      expect(res).toContain('Income: 85.00'); // 100 * 0.85
      expect(res).toContain('Expense: -17.00'); // -20 * 0.85
      expect(res).toContain('Balance: 68.00'); // 80 * 0.85


    });

});
