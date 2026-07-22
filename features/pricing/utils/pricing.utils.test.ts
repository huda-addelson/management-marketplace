import { describe, expect, it } from "vitest";

import {
  calculateDecant,
  calculateTargetPrice,
  resolveFees,
} from "./pricing.utils";
import { createInitialData } from "@/lib/seed-data";

describe("kalkulator harga Shopee", () => {
  const seed = createInitialData();
  const productFees = resolveFees(seed.fees, {}, "products");

  it("mengikuti contoh Warm Winter Intense pada spreadsheet", () => {
    const result = calculateTargetPrice({
      capitalCost: 171915,
      targetProfit: 25000,
      fees: productFees,
    });

    expect(result.sellingPrice).toBe(243895);
    expect(result.receivedAmount).toBe(196915);
    expect(result.actualProfit).toBe(25000);
  });

  it("mengikuti contoh Vanilla Clouds pada spreadsheet", () => {
    const result = calculateTargetPrice({
      capitalCost: 95000,
      targetProfit: 25000,
      fees: productFees,
    });

    expect(result.sellingPrice).toBe(149231);
    expect(result.receivedAmount).toBe(120000);
  });

  it("tidak menghasilkan harga untuk input kosong", () => {
    const result = calculateTargetPrice({
      capitalCost: 0,
      targetProfit: 0,
      fees: productFees,
    });

    expect(result.sellingPrice).toBe(0);
    expect(result.receivedAmount).toBe(0);
  });

  it("menolak fee uncapped 100% walaupun ada fee lain yang memiliki cap", () => {
    const uncapped = { ...seed.fees[0], value: 100, capAmount: null };
    const capped = { ...seed.fees[1], value: 5, capAmount: 10_000 };

    expect(() =>
      calculateTargetPrice({ capitalCost: 100_000, targetProfit: 10_000, fees: [uncapped, capped] }),
    ).toThrow("Total potongan persentase harus kurang dari 100%.");
  });
});

describe("kalkulator decant", () => {
  it("mengikuti hasil tab Kalkulator Decant", () => {
    const seed = createInitialData();
    const recipe = seed.decants[0];
    const fees = resolveFees(seed.fees, recipe.feeOverrides, "decants");
    const vial = seed.vialCosts.find((item) => item.id === recipe.vialCostId);
    const result = calculateDecant(recipe, vial, fees, 500);

    expect(result.capitalPerMl).toBe(3850);
    expect(result.totalCapitalCost).toBe(42000);
    expect(result.pricing.sellingPrice).toBe(74500);
    expect(result.pricing.actualProfit).toBe(10204);
    expect(result.stockPerBottle).toBe(10);
    expect(result.wholesaleTwoPrice).toBe(71000);
    expect(result.wholesaleThreePrice).toBe(69000);
    expect(result.wholesaleTwoProfit).toBe(16635);
    expect(result.wholesaleThreeProfit).toBe(21273);
    expect(result.bottleRevenue).toBe(745000);
    expect(result.bottleProfit).toBe(102038);
  });
});
