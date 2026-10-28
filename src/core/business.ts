import type { DiscountInput, MaterialPurchaseInput, MeasureUnit, PaymentSimulationInput, QuoteItemInput } from './types';

export const roundCurrency = (value: number): number => Number(value.toFixed(2));

export const convertToMeters = (value: number, unit: MeasureUnit = 'm'): number => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Valor inválido para conversão.');
  }

  switch (unit) {
    case 'cm':
      return value / 100;
    case 'mm':
      return value / 1000;
    case 'm':
    default:
      return value;
  }
};

export const calculateArea = (width: number, height: number, unit: MeasureUnit = 'm'): number => {
  const widthMeters = convertToMeters(width, unit);
  const heightMeters = convertToMeters(height, unit);
  return roundCurrency(widthMeters * heightMeters);
};

export const calculateItemSaleValue = (item: QuoteItemInput): { area: number; unitValue: number; total: number; quantity: number } => {
  const area = calculateArea(item.width, item.height, item.unit ?? 'm');
  const unitValue = roundCurrency(area * item.pricePerSqm);
  const total = roundCurrency(unitValue * item.quantity);

  return {
    area,
    unitValue,
    total,
    quantity: item.quantity,
  };
};

export const calculateMaterialPurchase = ({ neededQuantity, packageContent, unitPrice }: MaterialPurchaseInput) => {
  if (packageContent <= 0) {
    throw new Error('Conteúdo da embalagem deve ser maior que zero.');
  }

  const packages = Math.ceil(neededQuantity / packageContent);
  const purchaseTotal = roundCurrency(packages * unitPrice);
  const consumedValue = roundCurrency(Math.min(neededQuantity, packageContent) * unitPrice);
  const remaining = roundCurrency(packages * packageContent - neededQuantity);

  return {
    packages,
    purchaseTotal,
    consumedValue,
    remaining,
  };
};

export const calculateDiscount = ({ value, type, total }: DiscountInput): number => {
  if (type === 'percent') {
    return roundCurrency((total * value) / 100);
  }

  return roundCurrency(value);
};

export const calculateMargin = (cost: number, sellingPrice: number): number => {
  if (sellingPrice <= 0) return 0;
  return roundCurrency(((sellingPrice - cost) / sellingPrice) * 100);
};

export const calculateMarkup = (cost: number, sellingPrice: number): number => {
  if (cost <= 0) return 0;
  return roundCurrency(((sellingPrice - cost) / cost) * 100);
};

export const calculateRequiredGrossForNet = ({ amount, feePercent, fixedFee = 0, desiredNet }: PaymentSimulationInput): number => {
  if (desiredNet !== undefined) {
    return roundCurrency((desiredNet + fixedFee) / (1 - feePercent / 100));
  }

  if (feePercent <= 0 && fixedFee <= 0) {
    return roundCurrency(amount);
  }

  const gross = (amount + fixedFee) / (1 - feePercent / 100);
  return roundCurrency(gross);
};

export const consolidateMaterials = <T extends { code: string; specification?: string; thickness?: string; color?: string; unit?: string }>(items: T[]) => {
  return items.reduce<Record<string, T & { quantity: number }>>((acc, item) => {
    const key = `${item.code}|${item.specification ?? ''}|${item.thickness ?? ''}|${item.color ?? ''}|${item.unit ?? ''}`;

    if (!acc[key]) {
      acc[key] = { ...item, quantity: 1 } as T & { quantity: number };
      return acc;
    }

    acc[key].quantity += 1;
    return acc;
  }, {});
};
