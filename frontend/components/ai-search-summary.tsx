import { Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface AISearchSummaryProps {
  query: string
}

export function AISearchSummary({ query }: AISearchSummaryProps) {
  return (
    <Card className="border-2 border-purple-200 bg-purple-50/50">
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <Sparkles className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold">AI Search Summary</h3>
            <p className="text-sm text-muted-foreground">
              Found <span className="font-semibold text-foreground">127 offers</span> for "{query}" ranging from{" "}
              <span className="font-semibold text-foreground">$599 to $1,199</span>. Best deal:{" "}
              <span className="font-semibold text-foreground">$899 from Alibaba</span> with MOQ 50 units. Note: Most
              suppliers require minimum order quantities of 50-100 units.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
