"use client";

import type { EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import type { CSSProperties } from "react";

import { Skeleton } from "@/components/ui/skeleton";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => <Skeleton className="h-full min-h-64 w-full" />,
});

export function EChart({
  option,
  height = 320,
  mobileHeight,
  className,
}: {
  option: EChartsOption;
  height?: number;
  mobileHeight?: number;
  className?: string;
}) {
  return (
    <div
      className={`h-[var(--chart-mobile-height)] min-w-0 sm:h-[var(--chart-height)] ${className ?? ""}`}
      style={{
        "--chart-height": `${height}px`,
        "--chart-mobile-height": `${mobileHeight ?? height}px`,
      } as CSSProperties}
    >
      <ReactECharts option={option} notMerge lazyUpdate style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
