"use client";

import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import _ from "lodash";
import { ChartSpec } from "../../services/analyzeService";
import { AlertCircle } from "lucide-react";

interface ChartRendererProps {
  chartSpec: ChartSpec;
  rawData: Record<string, any>[];
}

const COLORS = ["#c97b5a", "#111110", "#4a6f7c", "#87a99c", "#e8c4b0", "#4a4845"];

export default function ChartRenderer({ chartSpec, rawData }: ChartRendererProps) {
  const { type, x_column, y_column, aggregation, title } = chartSpec;

  const chartData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    
    // Check if columns exist
    if (!(x_column in rawData[0]) || !(y_column in rawData[0])) {
      return null;
    }

    if (aggregation === "none") {
      return rawData.map(row => ({
        x: String(row[x_column]),
        y: Number(row[y_column]) || 0
      }));
    }

    // Grouping
    const grouped = _.groupBy(rawData, x_column);
    const result = Object.entries(grouped).map(([key, group]) => {
      let val = 0;
      const validNumbers = group.map(r => Number(r[y_column])).filter(n => !isNaN(n));
      
      if (aggregation === "sum") {
        val = _.sum(validNumbers);
      } else if (aggregation === "avg") {
        val = validNumbers.length ? _.sum(validNumbers) / validNumbers.length : 0;
      } else if (aggregation === "count") {
        val = group.length;
      }

      return { x: key, y: val };
    });

    // Optional: Sort for bar/line charts to look nicer (if x is categorical)
    // But we'll leave it as is to preserve original data order.
    return result;
  }, [rawData, x_column, y_column, aggregation]);

  if (chartData === null) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-[#faf8f5] border border-dashed border-[rgba(17,17,16,0.2)] rounded-lg text-[#4a4845]">
        <AlertCircle className="w-8 h-8 text-[#c97b5a] mb-2" />
        <p className="font-serif text-lg">Veri Uyuşmazlığı</p>
        <p className="font-sans text-sm mt-1 text-[#999490]">
          Belirtilen sütunlar ("{x_column}" veya "{y_column}") yüklenen veride bulunamadı.
        </p>
      </div>
    );
  }

  const getEchartsOption = () => {
    const xData = chartData.map(d => d.x);
    const yData = chartData.map(d => d.y);
    const baseFont = { fontFamily: "'DM Sans', sans-serif" };

    const commonOption = {
      title: {
        text: title,
        textStyle: { fontFamily: "'Playfair Display', serif", fontWeight: 400, color: "#111110", fontSize: 18 },
        left: "center",
        top: 10
      },
      tooltip: {
        trigger: type === "pie" ? "item" : "axis",
        backgroundColor: "#fff",
        borderColor: "rgba(17,17,16,0.1)",
        textStyle: { ...baseFont, color: "#111110" }
      },
      grid: { top: 60, right: 30, bottom: 40, left: 60, containLabel: true },
    };

    if (type === "pie") {
      return {
        ...commonOption,
        color: COLORS,
        series: [
          {
            name: y_column,
            type: "pie",
            radius: ["40%", "70%"],
            itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
            label: { ...baseFont, color: "#4a4845" },
            data: chartData.map((d, i) => ({ name: d.x, value: d.y }))
          }
        ]
      };
    }

    if (type === "scatter") {
      return {
        ...commonOption,
        xAxis: { type: "category", data: xData, axisLabel: { ...baseFont, color: "#999490" } },
        yAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(17,17,16,0.06)", type: "dashed" } }, axisLabel: { ...baseFont, color: "#999490" } },
        series: [{ name: y_column, type: "scatter", symbolSize: 10, itemStyle: { color: COLORS[0] }, data: yData }]
      };
    }

    return {
      ...commonOption,
      xAxis: { type: "category", data: xData, axisLabel: { ...baseFont, color: "#999490" } },
      yAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(17,17,16,0.06)", type: "dashed" } }, axisLabel: { ...baseFont, color: "#999490" } },
      series: [
        {
          name: y_column,
          type: type === "line" ? "line" : "bar",
          smooth: type === "line",
          barMaxWidth: 40,
          itemStyle: { borderRadius: type === "bar" ? [3, 3, 0, 0] : 0, color: COLORS[0] },
          lineStyle: type === "line" ? { color: COLORS[0], width: 2 } : undefined,
          data: yData
        }
      ]
    };
  };

  return (
    <div className="w-full h-full min-h-[400px] p-4 bg-white rounded-xl shadow-[0_4px_24px_rgba(17,17,16,0.04)] border border-[rgba(17,17,16,0.08)]">
      <ReactECharts
        option={getEchartsOption()}
        style={{ height: "100%", width: "100%", minHeight: "360px" }}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
}
