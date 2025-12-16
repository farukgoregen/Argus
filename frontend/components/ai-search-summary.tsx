import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

export function AISearchSummary() {
  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="flex items-start gap-4 p-4">
        <Sparkles className="mt-1 h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="font-medium">AI Search Summary</h3>
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30" variant="secondary">
              Generated
            </Badge>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div>
              <span className="text-muted-foreground">Best Deal: </span>
              <span className="font-medium text-accent">iPhone 15 Pro Max at $1,089</span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Price: </span>
              <span className="font-medium">$1,150 across 4 suppliers</span>
            </div>
            <div>
              <span className="text-muted-foreground">MOQ Warning: </span>
              <span className="font-medium text-chart-3">Alibaba requires min. 5 units</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
