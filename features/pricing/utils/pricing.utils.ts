import Decimal from "decimal.js";

import type {
  AppliedFee,
  DecantRecipe,
  FeeRule,
  Product,
  VialCost,
} from "@/types/domain";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export interface PriceCalculation {
  rawSellingPrice: number;
  sellingPrice: number;
  targetReceived: number;
  receivedAmount: number;
  totalFees: number;
  totalPercentage: number;
  totalFixed: number;
  actualProfit: number;
  fees: AppliedFee[];
}

export interface SaleCalculation {
  grossRevenue: number;
  receivedAmount: number;
  totalFees: number;
  totalCapitalCost: number;
  profit: number;
  fees: AppliedFee[];
}

export interface DecantCalculation {
  capitalPerMl: number;
  perfumeCapital: number;
  additionalCost: number;
  totalCapitalCost: number;
  pricing: PriceCalculation;
  stockPerBottle: number;
  wholesaleTwoPrice: number;
  wholesaleThreePrice: number;
  wholesaleTwoProfit: number;
  wholesaleThreeProfit: number;
  bottleRevenue: number;
  bottleProfit: number;
}

export function resolveFees(
  fees: FeeRule[],
  overrides: Record<string, boolean>,
  scope: "products" | "decants",
) {
  return fees.filter((fee) => {
    if (!fee.active || fee.archivedAt) {
      return false;
    }

    const override = overrides[fee.id];
    if (typeof override === "boolean") {
      return override;
    }

    return scope === "products" ? fee.defaultForProducts : fee.defaultForDecants;
  });
}

function feeAmount(price: Decimal, fee: FeeRule, quantity: number) {
  if (fee.kind === "fixed") {
    return new Decimal(fee.value).mul(fee.appliesPer === "item" ? quantity : 1);
  }

  let amount = price.mul(fee.value).div(100);
  if (fee.capAmount !== null && fee.capAmount >= 0) {
    const cap = new Decimal(fee.capAmount).mul(
      fee.appliesPer === "item" ? quantity : 1,
    );
    amount = Decimal.min(amount, cap);
  }

  return amount;
}

function calculateAppliedFees(price: Decimal, fees: FeeRule[], quantity: number) {
  return fees.map<AppliedFee>((fee) => ({
    feeId: fee.id,
    name: fee.name,
    kind: fee.kind,
    value: fee.value,
    amount: feeAmount(price, fee, quantity).toNumber(),
  }));
}

function totalFeeAmount(price: Decimal, fees: FeeRule[], quantity: number) {
  return fees.reduce(
    (total, fee) => total.add(feeAmount(price, fee, quantity)),
    new Decimal(0),
  );
}

function receivedFromPrice(price: Decimal, fees: FeeRule[], quantity: number) {
  return price.sub(totalFeeAmount(price, fees, quantity));
}

function roundPrice(value: Decimal, step: number, mode: "nearest" | "up") {
  const safeStep = Math.max(1, step);
  const divided = value.div(safeStep);
  const rounded = mode === "up"
    ? divided.ceil()
    : divided.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);

  return rounded.mul(safeStep);
}

function solvePriceWithCaps(target: Decimal, fees: FeeRule[]) {
  let low = new Decimal(0);
  let high = Decimal.max(target, 1);

  let expansion = 0;
  while (receivedFromPrice(high, fees, 1).lt(target) && expansion < 256) {
    high = high.mul(2);
    expansion += 1;
  }
  if (receivedFromPrice(high, fees, 1).lt(target)) {
    throw new Error("Kombinasi potongan tidak menghasilkan harga jual yang valid.");
  }

  for (let index = 0; index < 120; index += 1) {
    const middle = low.add(high).div(2);
    if (receivedFromPrice(middle, fees, 1).gte(target)) {
      high = middle;
    } else {
      low = middle;
    }
  }

  return high;
}

export function calculateTargetPrice({
  capitalCost,
  targetProfit,
  fees,
  roundingStep = 1,
  roundingMode = "nearest",
}: {
  capitalCost: number;
  targetProfit: number;
  fees: FeeRule[];
  roundingStep?: number;
  roundingMode?: "nearest" | "up";
}): PriceCalculation {
  const capital = new Decimal(Math.max(0, capitalCost || 0));
  const profit = new Decimal(Math.max(0, targetProfit || 0));
  const target = capital.add(profit);
  const percentageFees = fees.filter((fee) => fee.kind === "percentage");
  const totalPercentage = percentageFees.reduce((sum, fee) => sum + fee.value, 0);
  const uncappedPercentage = percentageFees
    .filter((fee) => fee.capAmount === null)
    .reduce((sum, fee) => sum + fee.value, 0);
  const totalFixed = fees
    .filter((fee) => fee.kind === "fixed")
    .reduce((sum, fee) => sum + fee.value, 0);

  if (target.eq(0)) {
    return {
      rawSellingPrice: 0,
      sellingPrice: 0,
      targetReceived: 0,
      receivedAmount: 0,
      totalFees: 0,
      totalPercentage,
      totalFixed,
      actualProfit: 0,
      fees: calculateAppliedFees(new Decimal(0), fees, 1),
    };
  }

  if (uncappedPercentage >= 100) {
    throw new Error("Total potongan persentase harus kurang dari 100%.");
  }

  const hasCaps = percentageFees.some((fee) => fee.capAmount !== null);
  const rawPrice = hasCaps
    ? solvePriceWithCaps(target, fees)
    : target
        .add(totalFixed)
        .div(new Decimal(1).sub(new Decimal(totalPercentage).div(100)));
  const roundedPrice = roundPrice(rawPrice, roundingStep, roundingMode);
  const appliedFees = calculateAppliedFees(roundedPrice, fees, 1);
  const exactReceived = receivedFromPrice(roundedPrice, fees, 1);
  const receivedAmount = exactReceived.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  const totalFees = roundedPrice.sub(receivedAmount);

  return {
    rawSellingPrice: rawPrice.toNumber(),
    sellingPrice: roundedPrice.toNumber(),
    targetReceived: target.toNumber(),
    receivedAmount: receivedAmount.toNumber(),
    totalFees: totalFees.toNumber(),
    totalPercentage,
    totalFixed,
    actualProfit: receivedAmount.sub(capital).toNumber(),
    fees: appliedFees,
  };
}

export function calculateProductPrice(product: Product, fees: FeeRule[]) {
  return calculateTargetPrice({
    capitalCost: product.capitalCost,
    targetProfit: product.targetProfit,
    fees: resolveFees(fees, product.feeOverrides, "products"),
    roundingStep: 1,
    roundingMode: "nearest",
  });
}

export function calculateSale({
  unitSellingPrice,
  quantity,
  unitCapitalCost,
  extraCost,
  fees,
}: {
  unitSellingPrice: number;
  quantity: number;
  unitCapitalCost: number;
  extraCost: number;
  fees: FeeRule[];
}): SaleCalculation {
  const safeQuantity = Math.max(1, Math.trunc(quantity || 1));
  const gross = new Decimal(Math.max(0, unitSellingPrice || 0)).mul(safeQuantity);
  const appliedFees = calculateAppliedFees(gross, fees, safeQuantity);
  const exactFees = totalFeeAmount(gross, fees, safeQuantity);
  const received = gross.sub(exactFees).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  const capital = new Decimal(Math.max(0, unitCapitalCost || 0)).mul(safeQuantity);
  const costs = capital.add(Math.max(0, extraCost || 0));

  return {
    grossRevenue: gross.toNumber(),
    receivedAmount: received.toNumber(),
    totalFees: gross.sub(received).toNumber(),
    totalCapitalCost: capital.toNumber(),
    profit: received.sub(costs).toNumber(),
    fees: appliedFees,
  };
}

export function calculateDecant(
  recipe: DecantRecipe,
  vial: VialCost | undefined,
  fees: FeeRule[],
  roundingStep = 500,
): DecantCalculation {
  const bottleVolume = Math.max(1, recipe.bottleVolumeMl || 1);
  const size = Math.max(1, recipe.decantSizeMl || 1);
  const capitalPerMl = new Decimal(Math.max(0, recipe.fullBottleCost || 0)).div(
    bottleVolume,
  );
  const perfumeCapital = capitalPerMl.mul(size);
  const additionalCost = new Decimal(Math.max(0, recipe.bubbleWrapCost || 0))
    .add(Math.max(0, recipe.stickerCost || 0))
    .add(Math.max(0, recipe.cardCost || 0));
  const totalCapital = perfumeCapital
    .add(vial?.active ? Math.max(0, vial.cost) : 0)
    .add(additionalCost);
  const pricing = calculateTargetPrice({
    capitalCost: totalCapital.toNumber(),
    targetProfit: recipe.targetProfit,
    fees,
    roundingStep,
    roundingMode: "up",
  });
  const stockPerBottle = Math.floor(bottleVolume / size);
  const wholesaleTwoPrice = roundPrice(
    new Decimal(pricing.sellingPrice).mul(
      new Decimal(1).sub(new Decimal(recipe.wholesaleTwoDiscount).div(100)),
    ),
    roundingStep,
    "up",
  ).toNumber();
  const wholesaleThreePrice = roundPrice(
    new Decimal(pricing.sellingPrice).mul(
      new Decimal(1).sub(new Decimal(recipe.wholesaleThreeDiscount).div(100)),
    ),
    roundingStep,
    "up",
  ).toNumber();
  const wholesaleTwo = calculateSale({
    unitSellingPrice: wholesaleTwoPrice,
    quantity: 2,
    unitCapitalCost: totalCapital.toNumber(),
    extraCost: 0,
    fees,
  });
  const wholesaleThree = calculateSale({
    unitSellingPrice: wholesaleThreePrice,
    quantity: 3,
    unitCapitalCost: totalCapital.toNumber(),
    extraCost: 0,
    fees,
  });
  const exactProfitPerItem = receivedFromPrice(
    new Decimal(pricing.sellingPrice),
    fees,
    1,
  ).sub(totalCapital);

  return {
    capitalPerMl: capitalPerMl.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber(),
    perfumeCapital: perfumeCapital.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber(),
    additionalCost: additionalCost.toNumber(),
    totalCapitalCost: totalCapital.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber(),
    pricing,
    stockPerBottle,
    wholesaleTwoPrice,
    wholesaleThreePrice,
    wholesaleTwoProfit: wholesaleTwo.profit,
    wholesaleThreeProfit: wholesaleThree.profit,
    bottleRevenue: new Decimal(stockPerBottle).mul(pricing.sellingPrice).toNumber(),
    bottleProfit: exactProfitPerItem
      .mul(stockPerBottle)
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
      .toNumber(),
  };
}
