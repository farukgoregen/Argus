import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockAIInsights } from "@/lib/mock-data"
import { TrendingDown, AlertTriangle, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const iconMap = {
  "price-drop": TrendingDown,
  "supplier-alert": AlertTriangle,
  trend: TrendingUp,
  "stock-alert": AlertTriangle,
}

const colorMap = {
  "price-drop": "text-accent",
  "supplier-alert": "text-chart-3",
  trend: "text-primary",
  "stock-alert": "text-destructive",
}

export function AIInsightsCards() {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">AI Insights</h3>
        <Badge variant="outline" className="bg-primary/10 text-primary">
          Powered by AI
        </Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockAIInsights.map((insight) => {
          const Icon = iconMap[insight.type]
          return (
            <Card key={insight.id} className="border-border bg-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Icon className={`h-5 w-5 ${colorMap[insight.type]}`} />
                  <span className="text-xs text-muted-foreground">{insight.timestamp}</span>
                </div>
                <CardTitle className="text-base">{insight.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">{insight.description}</CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
