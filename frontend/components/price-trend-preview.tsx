"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockPriceTrends } from "@/lib/mock-data"

// Chart colors - using explicit colors that work in both themes
const CHART_COLORS = {
  amazon: "#f97316",     // Orange
  alibaba: "#22c55e",    // Green  
  trendyol: "#3b82f6",   // Blue
  dhgate: "#a855f7",     // Purple
  grid: "#374151",       // Gray for grid
  axis: "#9ca3af",       // Light gray for axis
}

export function PriceTrendPreview() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render on server to avoid hydration mismatch
  if (!mounted) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>7-Day Price Trend Analysis</CardTitle>
          <CardDescription>Real-time supplier comparison for iPhone 15 Pro Max 256GB</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center">
            <span className="text-muted-foreground">Loading chart...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle>7-Day Price Trend Analysis</CardTitle>
        <CardDescription>Real-time supplier comparison for iPhone 15 Pro Max 256GB</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={mockPriceTrends}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke={CHART_COLORS.axis}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }}
              />
              <YAxis 
                stroke={CHART_COLORS.axis} 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                domain={[1050, 1250]}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(17, 24, 39, 0.95)",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#f9fafb",
                }}
                labelStyle={{ color: "#f9fafb", fontWeight: "bold" }}
                itemStyle={{ color: "#d1d5db" }}
                formatter={(value: number) => [`$${value}`, ""]}
                labelFormatter={(label) => {
                  const date = new Date(label)
                  return date.toLocaleDateString("en-US", { 
                    weekday: "short", 
                    month: "short", 
                    day: "numeric" 
                  })
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: "10px" }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="amazon"
                stroke={CHART_COLORS.amazon}
                strokeWidth={2}
                name="Amazon"
                dot={false}
                activeDot={{ r: 5 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="alibaba"
                stroke={CHART_COLORS.alibaba}
                strokeWidth={2}
                name="Alibaba"
                dot={false}
                activeDot={{ r: 5 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="trendyol"
                stroke={CHART_COLORS.trendyol}
                strokeWidth={2}
                name="Trendyol"
                dot={false}
                activeDot={{ r: 5 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="dhgate"
                stroke={CHART_COLORS.dhgate}
                strokeWidth={2}
                name="DHGate"
                dot={false}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
