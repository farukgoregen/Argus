"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockPriceTrends } from "@/lib/mock-data"

export function PriceTrendPreview() {
  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle>7-Day Price Trend Analysis</CardTitle>
        <CardDescription>Real-time supplier comparison for iPhone 15 Pro Max 256GB</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockPriceTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[1050, 1250]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend />
            <Line type="monotone" dataKey="amazon" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Amazon" />
            <Line type="monotone" dataKey="alibaba" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Alibaba" />
            <Line type="monotone" dataKey="trendyol" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Trendyol" />
            <Line type="monotone" dataKey="dhgate" stroke="hsl(var(--chart-4))" strokeWidth={2} name="DHGate" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
