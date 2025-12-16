import { Sparkles, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const insights = [
  "iPhone 15 Pro prices dropped 5% across 3 suppliers",
  "Average supplier response time: 2.4 hours",
  "Best time to buy electronics: Next week (predicted)",
]

export function AIInsightsCard() {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <CardTitle>AI Daily Insights</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-start gap-2 text-sm p-3 bg-muted rounded-lg">
            <div className="h-2 w-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
            <p>{insight}</p>
          </div>
        ))}
        <Button variant="link" className="p-0 h-auto">
          View All Insights <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
