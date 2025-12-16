"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const data = [
  { day: "Mon", Alibaba: 920, Trendyol: 950, Amazon: 890, DHGate: 940 },
  { day: "Tue", Alibaba: 915, Trendyol: 945, Amazon: 885, DHGate: 935 },
  { day: "Wed", Alibaba: 910, Trendyol: 940, Amazon: 880, DHGate: 930 },
  { day: "Thu", Alibaba: 905, Trendyol: 935, Amazon: 875, DHGate: 925 },
  { day: "Fri", Alibaba: 900, Trendyol: 930, Amazon: 870, DHGate: 920 },
  { day: "Sat", Alibaba: 895, Trendyol: 925, Amazon: 865, DHGate: 915 },
  { day: "Sun", Alibaba: 890, Trendyol: 920, Amazon: 860, DHGate: 910 },
]

export function PriceTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
        <XAxis
          dataKey="day"
          className="text-xs"
          stroke="hsl(var(--muted-foreground))"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          className="text-xs"
          stroke="hsl(var(--muted-foreground))"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
        />
        <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
        <Line
          type="monotone"
          dataKey="Alibaba"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2.5}
          dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="Trendyol"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2.5}
          dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="Amazon"
          stroke="hsl(var(--chart-3))"
          strokeWidth={2.5}
          dot={{ fill: "hsl(var(--chart-3))", r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="DHGate"
          stroke="hsl(var(--chart-4))"
          strokeWidth={2.5}
          dot={{ fill: "hsl(var(--chart-4))", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
