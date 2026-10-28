import { describe, expect, it } from 'vitest';
import {
  calculateArea,
  calculateDiscount,
  calculateItemSaleValue,
  calculateMargin,
  calculateMarkup,
  calculateMaterialPurchase,
  calculateRequiredGrossForNet,
  consolidateMaterials,
  convertToMeters,
} from '../src/core/business';

describe('Impacto Orçamento – regras de negócio', () => {
  it('calcula área frontal corretamente', () => {
    expect(calculateArea(2.4, 2.7)).toBe(6.48);
  });

  it('calcula preço de venda por metro quadrado', () => {
    const result = calculateItemSaleValue({ width: 2.4, height: 2.7, quantity: 1, pricePerSqm: 1200 });
    expect(result.area).toBe(6.48);
    expect(result.total).toBe(7776);
  });

  it('converte metros, centímetros e milímetros', () => {
    expect(convertToMeters(250, 'cm')).toBe(2.5);
    expect(convertToMeters(1500, 'mm')).toBe(1.5);
    expect(convertToMeters(3, 'm')).toBe(3);
  });

  it('calcula quantidade de embalagens e sobra', () => {
    const result = calculateMaterialPurchase({ neededQuantity: 65, packageContent: 20, unitPrice: 80 });
    expect(result.packages).toBe(4);
    expect(result.remaining).toBe(15);
  });

  it('calcula taxa de cartão para recebimento líquido desejado', () => {
    const gross = calculateRequiredGrossForNet({ amount: 10000, feePercent: 10, desiredNet: 10000 });
    expect(gross).toBe(11111.11);
  });

  it('consolida materiais equivalentes', () => {
    const result = consolidateMaterials([
      { code: 'MDF-15', specification: 'Carvalho', thickness: '15mm', color: 'Branco', unit: 'chapa' },
      { code: 'MDF-15', specification: 'Carvalho', thickness: '15mm', color: 'Branco', unit: 'chapa' },
      { code: 'MDF-15', specification: 'Carvalho', thickness: '15mm', color: 'Preto', unit: 'chapa' },
    ]);

    expect(Object.keys(result)).toHaveLength(2);
  });

  it('calcula desconto percentual', () => {
    const total = 3000;
    const discount = calculateDiscount({ total, value: 10, type: 'percent' });
    expect(discount).toBe(300);
  });

  it('calcula margem e markup', () => {
    expect(calculateMargin(1500, 2500)).toBe(40);
    expect(calculateMarkup(1500, 2500)).toBe(66.67);
  });
});
