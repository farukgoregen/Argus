import {
  FileText,
  Users,
  AlertTriangle,
  TrendingUp,
  Bell,
  Settings,
  LinkIcon,
  Award,
  MessageSquare,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

const summaryCards = [
  {
    title: "Incoming RFQ",
    value: "24",
    description: "Pending quotes",
    icon: FileText,
    color: "text-blue-500",
  },
  {
    title: "New Customers",
    value: "8",
    description: "This week",
    icon: Users,
    color: "text-green-500",
  },
  {
    title: "Critical Stock",
    value: "3",
    description: "Items low",
    icon: AlertTriangle,
    color: "text-orange-500",
  },
  {
    title: "Revenue",
    value: "$45.2K",
    description: "This month",
    icon: TrendingUp,
    color: "text-purple-500",
  },
]

const managementActions = [
  { title: "Quote Management", icon: FileText, enabled: true },
  { title: "Connect API Source", icon: LinkIcon, enabled: false },
  { title: "Trust Score", icon: Award, enabled: true },
  { title: "RFQ Notifications", icon: Bell, enabled: true },
  { title: "Auto-Response Settings", icon: MessageSquare, enabled: false },
  { title: "Price Update Alerts", icon: TrendingUp, enabled: true },
  { title: "Customer Management", icon: Users, enabled: true },
  { title: "Inventory Sync", icon: Settings, enabled: false },
]

export default function SupplierDashboardPage() {
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your supplier account and settings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Management & Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Management & Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {managementActions.map((action, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div className="flex items-center gap-3">
                  <action.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{action.title}</span>
                </div>
                <Switch checked={action.enabled} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button variant="outline" className="justify-start bg-transparent">
              <FileText className="mr-2 h-4 w-4" />
              View All RFQs
            </Button>
            <Button variant="outline" className="justify-start bg-transparent">
              <Users className="mr-2 h-4 w-4" />
              Customer List
            </Button>
            <Button variant="outline" className="justify-start bg-transparent">
              <TrendingUp className="mr-2 h-4 w-4" />
              Update Prices
            </Button>
            <Button variant="outline" className="justify-start bg-transparent">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
