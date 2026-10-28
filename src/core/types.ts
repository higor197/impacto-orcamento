export type MeasureUnit = 'm' | 'cm' | 'mm';

export interface QuoteItemInput {
  width: number;
  height: number;
  quantity: number;
  pricePerSqm: number;
  unit?: MeasureUnit;
}

export interface MaterialPurchaseInput {
  neededQuantity: number;
  packageContent: number;
  unitPrice: number;
}

export interface PaymentSimulationInput {
  amount: number;
  feePercent: number;
  fixedFee?: number;
  desiredNet?: number;
}

export interface DiscountInput {
  value: number;
  type: 'percent' | 'fixed';
  total: number;
}
