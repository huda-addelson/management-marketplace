"use client";

import type { EChartsOption } from "echarts";

import { EChart } from "@/components/shared/echart";
import { formatPercent } from "@/lib/utils";

const colors = ["#153f36", "#f16d4b", "#efb64b", "#78a797", "#7181d8"];

export function FeeDonutChart({ data }: { data: Array<{ name: string; value: number }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const option: EChartsOption = {
    animationDuration: 650,
    color: colors,
    tooltip: {
      trigger: "item",
      confine: true,
      formatter: (params: unknown) => {
        const item = params as { name: string; value: number };
        return `${item.name}<br/><b>${formatPercent(item.value)}</b>`;
      },
      backgroundColor: "#ffffff",
      borderColor: "rgba(14,35,30,.09)",
      textStyle: { color: "#101917", fontSize: 12 },
    },
    series: [{
      type: "pie",
      radius: [55, 82],
      center: ["50%", "50%"],
      padAngle: 3,
      label: { show: false },
      itemStyle: { borderRadius: 7, borderColor: "#ffffff", borderWidth: 2 },
      data,
    }],
  };

  return (
    <div className="relative">
      <EChart option={option} height={205} mobileHeight={205} />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold tracking-[-0.05em]">{formatPercent(total)}</span>
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ink-soft)]">total persen</span>
      </div>
    </div>
  );
}
