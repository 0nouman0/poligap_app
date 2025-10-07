"use client";

import React, { useState } from "react";
import { Settings, User, Bell, Shield, Save, CreditCard, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Profile Settings
    companyName: "Poligap Legal Services",
    email: "user@company.com",
    timezone: "UTC-5",
    
    // Notification Settings
    emailNotifications: true,
    complianceAlerts: true,
    
    // Security Settings
    twoFactorAuth: false,
    
    // AI Settings
    autoAnalysis: true,
    
    // Billing Settings
    billingEmail: "billing@company.com",
    currentPlan: "Professional",
    billingCycle: "monthly",
    autoRenew: true,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    console.log("Saving settings:", settings);
    alert("Settings saved successfully!");
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your Poligap preferences
          </p>
        </div>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>
              Basic account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => handleSettingChange("companyName", e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => handleSettingChange("email", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={settings.timezone} onValueChange={(value) => handleSettingChange("timezone", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                  <SelectItem value="UTC-7">Mountain Time (UTC-7)</SelectItem>
                  <SelectItem value="UTC-6">Central Time (UTC-6)</SelectItem>
                  <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                  <SelectItem value="UTC+0">UTC</SelectItem>
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
            <CardDescription>
              Control your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compliance Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about compliance issues
                </p>
              </div>
              <Switch
                checked={settings.complianceAlerts}
                onCheckedChange={(checked) => handleSettingChange("complianceAlerts", checked)}
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
            <CardDescription>
              Manage your account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add extra security to your account
                </p>
              </div>
              <Switch
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => handleSettingChange("twoFactorAuth", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              AI Assistant
            </CardTitle>
            <CardDescription>
              Configure AI behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Analysis</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically analyze uploaded documents
                </p>
              </div>
              <Switch
                checked={settings.autoAnalysis}
                onCheckedChange={(checked) => handleSettingChange("autoAnalysis", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Billing & Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing & Subscription
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Plan */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Current Plan</Label>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{settings.currentPlan} Plan</h3>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Unlimited AI agents, advanced analytics, priority support
                  </p>
                  <p className="text-sm font-medium">$99/month • Next billing: Dec 7, 2024</p>
                </div>
                <Button variant="outline" size="sm">
                  Change Plan
                </Button>
              </div>
            </div>

            <Separator />

            {/* Billing Information */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Billing Information</Label>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="billingEmail">Billing Email</Label>
                  <Input
                    id="billingEmail"
                    type="email"
                    value={settings.billingEmail}
                    onChange={(e) => handleSettingChange("billingEmail", e.target.value)}
                    placeholder="billing@company.com"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="billingCycle">Billing Cycle</Label>
                  <Select value={settings.billingCycle} onValueChange={(value) => handleSettingChange("billingCycle", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly ($99/month)</SelectItem>
                      <SelectItem value="yearly">Yearly ($990/year - Save 17%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Usage & Limits */}
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Usage This Month
              </Label>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Documents Analyzed</span>
                  <span className="text-sm font-medium">247 / 1,000</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24.7%' }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">AI Agent Hours</span>
                  <span className="text-sm font-medium">68 / 200</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '34%' }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">API Calls</span>
                  <span className="text-sm font-medium">3,247 / 10,000</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-orange-600 h-2 rounded-full" style={{ width: '32.47%' }}></div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Auto Renewal */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Auto Renewal
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically renew your subscription
                </p>
              </div>
              <Switch
                checked={settings.autoRenew}
                onCheckedChange={(checked) => handleSettingChange("autoRenew", checked)}
              />
            </div>

            {/* Billing Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Update Payment Method
              </Button>
              <Button variant="outline" size="sm">
                Download Invoices
              </Button>
              <Button variant="outline" size="sm">
                Billing History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
