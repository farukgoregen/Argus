"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Moon,
  Sun,
  Monitor,
  Bell,
  BellOff,
  Globe,
  Lock,
  LogOut,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"

// Notification settings (stored in localStorage for now)
interface NotificationSettings {
  emailNotifications: boolean
  priceAlerts: boolean
  newMessages: boolean
  orderUpdates: boolean
  marketingEmails: boolean
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailNotifications: true,
  priceAlerts: true,
  newMessages: true,
  orderUpdates: true,
  marketingEmails: false,
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS)

  // Language preference
  const [language, setLanguage] = useState("en")

  // Mount check for theme
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNotifications = localStorage.getItem('argus_notifications')
      if (savedNotifications) {
        try {
          setNotifications(JSON.parse(savedNotifications))
        } catch {
          // Use defaults
        }
      }

      const savedLanguage = localStorage.getItem('argus_language')
      if (savedLanguage) {
        setLanguage(savedLanguage)
      }
    }
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Save notification setting
  const updateNotification = (key: keyof NotificationSettings, value: boolean) => {
    const updated = { ...notifications, [key]: value }
    setNotifications(updated)
    localStorage.setItem('argus_notifications', JSON.stringify(updated))
    toast.success('Notification preference saved')
  }

  // Save language preference
  const updateLanguage = (value: string) => {
    setLanguage(value)
    localStorage.setItem('argus_language', value)
    toast.success('Language preference saved')
  }

  // Validate password change
  const validatePasswordChange = (): boolean => {
    const errors: Record<string, string> = {}

    if (!currentPassword) {
      errors.currentPassword = "Current password is required"
    }

    if (!newPassword) {
      errors.newPassword = "New password is required"
    } else if (newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters"
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password"
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle password change
  const handlePasswordChange = async () => {
    if (!validatePasswordChange()) return

    setIsChangingPassword(true)
    try {
      // TODO: Implement actual password change API call
      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordErrors({})
    } catch {
      toast.error("Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch {
      toast.error("Failed to logout")
    }
  }

  // Handle account deletion (placeholder)
  const handleDeleteAccount = async () => {
    // TODO: Implement actual account deletion
    toast.error("Account deletion is not yet implemented. Please contact support.")
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how Argus looks on your device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">Select your preferred theme</p>
              </div>
              {mounted && (
                <div className="flex gap-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="gap-2"
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="gap-2"
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('system')}
                    className="gap-2"
                  >
                    <Monitor className="h-4 w-4" />
                    System
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language & Region
            </CardTitle>
            <CardDescription>Set your language and regional preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Display Language</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred language</p>
              </div>
              <Select value={language} onValueChange={updateLanguage}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="tr">Türkçe</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                checked={notifications.emailNotifications}
                onCheckedChange={(v) => updateNotification('emailNotifications', v)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Price Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when watched products change price</p>
              </div>
              <Switch
                checked={notifications.priceAlerts}
                onCheckedChange={(v) => updateNotification('priceAlerts', v)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>New Messages</Label>
                <p className="text-sm text-muted-foreground">Notify when you receive new messages</p>
              </div>
              <Switch
                checked={notifications.newMessages}
                onCheckedChange={(v) => updateNotification('newMessages', v)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Order Updates</Label>
                <p className="text-sm text-muted-foreground">Get updates on your orders and inquiries</p>
              </div>
              <Switch
                checked={notifications.orderUpdates}
                onCheckedChange={(v) => updateNotification('orderUpdates', v)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">Receive tips, promotions, and newsletters</p>
              </div>
              <Switch
                checked={notifications.marketingEmails}
                onCheckedChange={(v) => updateNotification('marketingEmails', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your password and security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account info */}
            <div className="rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user?.email}</p>
                  <p className="text-sm text-muted-foreground">@{user?.username}</p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {user?.user_type}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Change password */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Change Password</Label>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">
                    Current Password
                    {passwordErrors.currentPassword && (
                      <span className="text-destructive text-sm ml-2">{passwordErrors.currentPassword}</span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className={passwordErrors.currentPassword ? "border-destructive pr-10" : "pr-10"}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-password">
                    New Password
                    {passwordErrors.newPassword && (
                      <span className="text-destructive text-sm ml-2">{passwordErrors.newPassword}</span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className={passwordErrors.newPassword ? "border-destructive pr-10" : "pr-10"}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">
                    Confirm New Password
                    {passwordErrors.confirmPassword && (
                      <span className="text-destructive text-sm ml-2">{passwordErrors.confirmPassword}</span>
                    )}
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={passwordErrors.confirmPassword ? "border-destructive" : ""}
                  />
                </div>

                <Button 
                  onClick={handlePasswordChange} 
                  disabled={isChangingPassword}
                  className="w-full sm:w-auto"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session & Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Account Actions
            </CardTitle>
            <CardDescription>Logout or delete your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Logout</Label>
                <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-destructive">Delete Account</Label>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers, including:
                      <ul className="mt-2 list-disc pl-4 space-y-1">
                        <li>Your profile information</li>
                        <li>All your products (if supplier)</li>
                        <li>Your watchlist and preferences</li>
                        <li>All message history</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
