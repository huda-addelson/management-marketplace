"use client";

import type { EChartsOption } from "echarts";

import { EChart } from "@/components/shared/echart";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

import type { BrandMetric } from "../types/dashboard.type";

export function BrandPortfolioChart({ data }: { data: BrandMetric[] }) {
  const option: EChartsOption = {
    animationDuration: 650,
    color: ["#153f36", "#f16d4b"],
    grid: { top: 38, right: 8, bottom: 20, left: 8, containLabel: true },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 9,
      itemHeight: 9,
      icon: "circle",
      textStyle: { color: "#65716d", fontSize: 11 },
    },
    tooltip: {
      trigger: "axis",
      confine: true,
      backgroundColor: "#ffffff",
      borderColor: "rgba(14,35,30,.09)",
      textStyle: { color: "#101917", fontSize: 12 },
      valueFormatter: (value) => formatCurrency(Number(value)),
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.brand),
      axisLine: { lineStyle: { color: "rgba(14,35,30,.09)" } },
      axisTick: { show: false },
      axisLabel: { color: "#65716d", fontSize: 10, interval: 0, rotate: data.length > 7 ? 25 : 0 },
    },
    yAxis: {
      type: "value",
      splitNumber: 4,
      axisLabel: { color: "#65716d", fontSize: 10, formatter: (value: number) => formatCompactCurrency(value).replace("Rp", "") },
      splitLine: { lineStyle: { color: "rgba(14,35,30,.075)", type: "dashed" } },
    },
    series: [
      { name: "Modal", type: "bar", data: data.map((item) => item.modal), barMaxWidth: 44, itemStyle: { borderRadius: [8, 8, 2, 2] } },
      { name: "Target laba", type: "bar", data: data.map((item) => item.target), barMaxWidth: 44, itemStyle: { borderRadius: [8, 8, 2, 2] } },
    ],
  };
  return <EChart option={option} height={310} mobileHeight={270} />;
}
