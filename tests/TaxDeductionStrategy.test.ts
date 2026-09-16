import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaxDeductionStrategy } from '../src/strategies/TaxDeductionStrategy.js';
import { TaxConfigService } from '../src/services/TaxConfigService.js';
import { Transaction } from '../src/models.js';

describe('TaxDeductionStrategy (Feature 4)', () => {
  let strategy: TaxDeductionStrategy;

  beforeEach(() => {
    strategy = new TaxDeductionStrategy();
    vi.restoreAllMocks();
  });

  // Example of how to write and mock in your tests:
  //
  // it('should compute tax savings correctly based on rate and deductible categories', async () => {
  //   const mockConfig = { standardTaxRate: 0.10, deductibleCategories: ['Medical', 'Charity'] };
  //   const spy = vi.spyOn(TaxConfigService, 'getTaxConfig').mockResolvedValue(mockConfig);
  //
  //   const testTransactions: Transaction[] = [
  //     { id: '1', date: '2026-05-01', amount: -200.00, category: 'Charity', description: 'Donation', status: 'completed' }, // Deductible
  //     { id: '2', date: '2026-05-02', amount: -100.00, category: 'Food', description: 'Grocery', status: 'completed' }, // Non-deductible
  //   ];
  //
  //   const result = await strategy.execute(testTransactions);
  //
  //   expect(spy).toHaveBeenCalled();
  //   expect(result).toContain('Deductions: $200.00'); // Sum of Charity
  //   expect(result).toContain('Savings: $20.00'); // $200 * 0.10
  // });

  // Prewritten test todos
  it('should filter only the categories specified as deductible in the config', async ()=> {
    const mockConfig = {standardTaxRate: 0.10, deductibleCategories: ['Charity']};
    const spy =  vi.spyOn(TaxConfigService, "getTaxConfig").mockResolvedValue(mockConfig);

    const testTransactions: Transaction[] = [
       { id: '1', date: '2026-05-01', amount: -200.00, category: 'Charity', description: 'Donation', status: 'completed' }, // Deductible
       { id: '2', date: '2026-05-02', amount: -100.00, category: 'Food', description: 'Grocery', status: 'completed' }, // Non-deductible
     ];
    
    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toContain("Category: Charity");
    expect(result).not.toContain("Category: Food");
  });

  it('should sum total eligible tax deductions correctly', async() => {
    const mockConfig = {standardTaxRate: 0.10, deductibleCategories: ['Charity', 'Medical']};
    const spy =  vi.spyOn(TaxConfigService, "getTaxConfig").mockResolvedValue(mockConfig);

    const testTransactions: Transaction[] = [
       { id: '1', date: '2026-05-01', amount: -100.00, category: 'Charity', description: 'Charity', status: 'completed' }, // Deductible
       { id: '2', date: '2026-05-02', amount: -100.00, category: 'Medical', description: 'Medical', status: 'completed' }, // Deductible
     ];

    const result = await strategy.execute(testTransactions);
    
    expect(spy).toHaveBeenCalled();
    expect(result).toContain("Total Value of Deductible Transactions: $200");
  });

  it('should calculate estimated tax savings using standardTaxRate', async() => {
    const mockConfig = {standardTaxRate: 0.10, deductibleCategories: ['Charity']};
    const spy =  vi.spyOn(TaxConfigService, "getTaxConfig").mockResolvedValue(mockConfig);

    const testTransactions: Transaction[] = [
       { id: '1', date: '2026-05-01', amount: -100.00, category: 'Charity', description: 'Charity', status: 'completed' }, // Deductible
     ];

    const result = await strategy.execute(testTransactions);
    
    expect(spy).toHaveBeenCalled();
    expect(result).toContain("Estimated Tax Savings: $10");
  });

  it('should calculate estimated VAT/sales tax paid on non-deductible expense transactions', async() =>{
    const mockConfig = {standardTaxRate: 0.10, deductibleCategories: ['Charity']};
    const spy =  vi.spyOn(TaxConfigService, "getTaxConfig").mockResolvedValue(mockConfig);

    const testTransactions: Transaction[] = [
       { id: '1', date: '2026-05-01', amount: -100.00, category: 'Medical', description: 'Charity', status: 'completed' }, // Non-Deductible
     ];

    const result = await strategy.execute(testTransactions);
    
    expect(spy).toHaveBeenCalled();
    expect(result).toContain("Estimated Sales Tax (VAT): $");
  });

  it('should structure report to show both aggregates and itemized deductible transactions', async() => {
    const mockConfig = {standardTaxRate: 0.10, deductibleCategories: ['Charity']};
    const spy =  vi.spyOn(TaxConfigService, "getTaxConfig").mockResolvedValue(mockConfig);

    const testTransactions: Transaction[] = [
       { id: '1', date: '2026-05-01', amount: -200.00, category: 'Medical', description: 'Medicine', status: 'completed' }, // Non-Deductible
       { id: '2', date: '2026-05-02', amount: -100.00, category: 'Charity', description: 'Charity', status: 'completed' }, // Deductible
     ];

    const result = await strategy.execute(testTransactions);
    
    expect(spy).toHaveBeenCalled();
    expect(result).toContain("Eligible Transactions:");
    expect(result).toContain("ID: 2, Amount: $100, Category: Charity");
    
    expect(result).toContain("Total Value of Deductible Transactions: $100");
    expect(result).toContain("Estimated Tax Savings: $10");

    expect(result).toContain("Estimated Sales Tax (VAT): $20");
  
  }
  );

  //aarav test for incorrect data input
  // Test 1: Empty transactions
  it('should display a message when transactions are empty', async() => {
    const mockConfig = {standardTaxRate: 0.10, deductibleCategories: ['Charity']};
    const spy =  vi.spyOn(TaxConfigService, "getTaxConfig").mockResolvedValue(mockConfig);

    const testTransactions: Transaction[] = [];

    const result = await strategy.execute(testTransactions);

    expect(result).toEqual("No transactions found");

  });

  //Test 2: 0% tax rate
  it('0 percent tax rate should 0 tax paid and 0 tax saved', async() => {
    const mockConfig = {standardTaxRate: 0.0, deductibleCategories: ['Charity']};
    const spy =  vi.spyOn(TaxConfigService, "getTaxConfig").mockResolvedValue(mockConfig);

    const testTransactions: Transaction[] = [
       { id: '1', date: '2026-05-01', amount: -200.00, category: 'Medical', description: 'Charity', status: 'completed' }, // Non-Deductible
       { id: '2', date: '2026-05-02', amount: -100.00, category: 'Charity', description: 'Charity', status: 'completed' }, // Deductible
     ];

    const result = await strategy.execute(testTransactions);
    
    expect(spy).toHaveBeenCalled();
    expect(result).toContain("ID: 2, Amount: $100, Category: Charity");
    expect(result).toContain("Total Value of Deductible Transactions: $100");
    expect(result).toContain("Estimated Tax Savings: $0");
    expect(result).toContain("Estimated Sales Tax (VAT): $0");
  
  }
  );
  
  //Test 3: No deductible categories
  it('should handle no deductible categories without failing', async() => {
      const mockConfig = {standardTaxRate: 0.10, deductibleCategories: []};
      const spy =  vi.spyOn(TaxConfigService, "getTaxConfig").mockResolvedValue(mockConfig);

      const testTransactions: Transaction[] = [
        { id: '1', date: '2026-05-01', amount: -200.00, category: 'Medical', description: 'Charity', status: 'completed' }, // Non-Deductible
        { id: '2', date: '2026-05-02', amount: -100.00, category: 'Charity', description: 'Charity', status: 'completed' }, // Deductible
      ];

      const result = await strategy.execute(testTransactions);
      
      expect(spy).toHaveBeenCalled();
      expect(result).toContain("Total Value of Deductible Transactions: $0");
    
    }
    );

});
