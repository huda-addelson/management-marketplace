export type FeeKind = "percentage" | "fixed";

export type FeeAppliesPer = "item" | "order";

export type SaleSource = "manual" | "import";

export interface FeeRule {
  id: string;
  name: string;
  kind: FeeKind;
  value: number;
  appliesPer: FeeAppliesPer;
  capAmount: number | null;
  active: boolean;
  defaultForProducts: boolean;
  defaultForDecants: boolean;
  effectiveFrom: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  brand: string;
  size: string;
  name: string;
  sku: string;
  capitalCost: number;
  targetProfit: number;
  stock: number;
  lowStockThreshold: number;
  feeOverrides: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface VialCost {
  id: string;
  sizeMl: number;
  cost: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DecantRecipe {
  id: string;
  name: string;
  concentration: string;
  fullBottleCost: number;
  bottleVolumeMl: number;
  decantSizeMl: number;
  vialCostId: string | null;
  bubbleWrapCost: number;
  stickerCost: number;
  cardCost: number;
  targetProfit: number;
  wholesaleTwoDiscount: number;
  wholesaleThreeDiscount: number;
  feeOverrides: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface AppliedFee {
  feeId: string;
  name: string;
  kind: FeeKind;
  value: number;
  amount: number;
}

export interface Sale {
  id: string;
  orderNumber: string;
  soldAt: string;
  source: SaleSource;
  calculationMode: "estimated" | "actual";
  stockAdjusted: boolean;
  stockDelta?: number;
  productId: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitSellingPrice: number;
  grossRevenue: number;
  receivedAmount: number;
  unitCapitalCost: number;
  totalCapitalCost: number;
  extraCost: number;
  totalFees: number;
  profit: number;
  feeSnapshot: AppliedFee[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  storeName: string;
  ownerName: string;
  openingCapital: number;
  currency: "IDR";
  productRounding: "nearest-rupiah";
  decantRoundingStep: number;
}

export interface InitialData {
  version: number;
  fees: FeeRule[];
  products: Product[];
  vialCosts: VialCost[];
  decants: DecantRecipe[];
  sales: Sale[];
  settings: AppSettings;
  updatedAt: string;
}
