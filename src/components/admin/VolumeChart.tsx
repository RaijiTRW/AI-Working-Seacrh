"use client";

import { useMemo } from "react";
import { VolumeDataPoint } from "@/lib/api";

interface VolumeChartProps {
  data: VolumeDataPoint[];
  height?: number;
  isLoading?: boolean;
}

export default function VolumeChart({ data, height = 200, isLoading }: VolumeChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = 100; // Percentage width
    const chartHeight = height - padding.top - padding.bottom;
    const chartWidth = width;

    // Find min/max for Y axis
    const maxValue = Math.max(...data.map((d) => d.total), 1);
    const minValue = 0;

    // Generate points for each line
    const generatePoints = (getValue: (d: VolumeDataPoint) => number) => {
      return data
        .map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = ((maxValue - getValue(d)) / (maxValue - minValue)) * 100;
          return `${x},${y}`;
        })
        .join(" ");
    };

    // Generate time labels
    const labels: { x: number; label: string }[] = [];
    const step = Math.max(1, Math.floor(data.length / 6));
    for (let i = 0; i < data.length; i += step) {
      const date = new Date(data[i].recorded_at);
      labels.push({
        x: (i / (data.length - 1)) * 100,
        label: date.toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }

    // Y axis labels
    const yLabels = [0, Math.round(maxValue / 2), maxValue].map((val) => ({
      y: ((maxValue - val) / maxValue) * 100,
      label: val.toLocaleString("ru-RU"),
    }));

    return {
      totalPoints: generatePoints((d) => d.total),
      padding,
      chartHeight,
      chartWidth,
      labels,
      yLabels,
      maxValue,
      latestData: data[data.length - 1],
    };
  }, [data, height]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Объём вакансий</h3>
        <div className="animate-pulse">
          <div className="h-[200px] bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Объём вакансий</h3>
        <div className="flex items-center justify-center h-[200px] text-gray-500 text-sm">
          Нет данных для графика
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Объём вакансий</h3>
        {chartData.latestData && (
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-gray-600">
                Всего: {chartData.latestData.total.toLocaleString("ru-RU")}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="relative" style={{ height }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
          style={{ overflow: "visible" }}
        >
          {/* Grid lines */}
          {chartData.yLabels.map((label, i) => (
            <line
              key={i}
              x1="0"
              y1={label.y}
              x2="100"
              y2={label.y}
              stroke="#f3f4f6"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* Area fill */}
          <polygon
            points={`0,100 ${chartData.totalPoints} 100,100`}
            fill="url(#gradient)"
            opacity="0.3"
          />

          {/* Line */}
          <polyline
            points={chartData.totalPoints}
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Y axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500 pointer-events-none">
          {chartData.yLabels.map((label, i) => (
            <span
              key={i}
              className="leading-none"
              style={{
                position: "absolute",
                top: `${label.y}%`,
                transform: "translateY(-50%)",
              }}
            >
              {label.label}
            </span>
          ))}
        </div>

        {/* X axis labels */}
        <div className="absolute left-12 right-0 bottom-0 h-6 flex justify-between text-xs text-gray-500 pointer-events-none">
          {chartData.labels.map((label, i) => (
            <span
              key={i}
              className="text-center"
              style={{
                position: "absolute",
                left: `${label.x}%`,
                transform: "translateX(-50%)",
              }}
            >
              {label.label.split(", ")[0]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
