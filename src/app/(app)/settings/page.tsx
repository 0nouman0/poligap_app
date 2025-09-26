"use client";

import React, { useState } from "react";
import { Settings, User, Shield, Bell, Database, Key, Globe, Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // General Settings
    companyName: "Poligap Legal Services",
    timezone: "UTC-5",
    language: "en",
    
    // Security Settings
    twoFactorAuth: true,
    sessionTimeout: "30",
    passwordExpiry: "90",
    
    // Notification Settings
    emailNotifications: true,
    complianceAlerts: true,
    contractReminders: true,
    weeklyReports: false,
    
    // AI Agent Settings
    autoAnalysis: true,
    confidenceThreshold: "85",
    maxConcurrentTasks: "5",
    
    // Integration Settings
    krooloSync: true,
    apiAccess: false,
    webhookUrl: "",
    
    // Billing Settings
    billingEmail: "billing@company.com",
    plan: "professional"
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Simulate saving settings
    console.log("Saving settings:", settings);
    // Show success message
  };

  return (
    <div className="w-full max-w-none p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your Poligap platform preferences and configurations
          </p>
        </div>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="ai-agents">AI Agents</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Configure basic platform settings and preferences
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

              <div className="grid gap-2">
                <Label htmlFor="language">Language</Label>
                <Select value={settings.language} onValueChange={(value) => handleSettingChange("language", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage security preferences and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => handleSettingChange("twoFactorAuth", checked)}
                />
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Select value={settings.sessionTimeout} onValueChange={(value) => handleSettingChange("sessionTimeout", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                <Select value={settings.passwordExpiry} onValueChange={(value) => handleSettingChange("passwordExpiry", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance Standards
              </CardTitle>
              <CardDescription>
                Configure which compliance standards to check against by default
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: "hipaa", name: "HIPAA", description: "Healthcare compliance" },
                  { id: "gdpr", name: "GDPR", description: "EU data protection" },
                  { id: "ccpa", name: "CCPA", description: "California privacy" },
                  { id: "sox", name: "SOX", description: "Financial compliance" },
                  { id: "pci-dss", name: "PCI DSS", description: "Payment security" },
                  { id: "iso-27001", name: "ISO 27001", description: "Information security" },
                  { id: "nist", name: "NIST", description: "Cybersecurity framework" },
                  { id: "fisma", name: "FISMA", description: "Federal security" },
                  { id: "ferpa", name: "FERPA", description: "Educational privacy" },
                  { id: "glba", name: "GLBA", description: "Financial privacy" },
                  { id: "soc2", name: "SOC 2", description: "Service organization controls" },
                  { id: "fedramp", name: "FedRAMP", description: "Federal cloud security" }
                ].map((standard) => (
                  <div key={standard.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Switch
                      id={standard.id}
                      defaultChecked={["hipaa", "gdpr", "iso-27001"].includes(standard.id)}
                    />
                    <div className="flex-1">
                      <label htmlFor={standard.id} className="text-sm font-medium cursor-pointer">
                        {standard.name}
                      </label>
                      <p className="text-xs text-muted-foreground">{standard.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Control how and when you receive notifications
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
                    Get notified about compliance issues and deadlines
                  </p>
                </div>
                <Switch
                  checked={settings.complianceAlerts}
                  onCheckedChange={(checked) => handleSettingChange("complianceAlerts", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Contract Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Reminders for contract reviews and renewals
                  </p>
                </div>
                <Switch
                  checked={settings.contractReminders}
                  onCheckedChange={(checked) => handleSettingChange("contractReminders", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly summary reports
                  </p>
                </div>
                <Switch
                  checked={settings.weeklyReports}
                  onCheckedChange={(checked) => handleSettingChange("weeklyReports", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                AI Agent Configuration
              </CardTitle>
              <CardDescription>
                Configure AI agent behavior and performance settings
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

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="confidenceThreshold">Confidence Threshold (%)</Label>
                <Select value={settings.confidenceThreshold} onValueChange={(value) => handleSettingChange("confidenceThreshold", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="70">70%</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="80">80%</SelectItem>
                    <SelectItem value="85">85%</SelectItem>
                    <SelectItem value="90">90%</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Minimum confidence level for AI recommendations
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxTasks">Max Concurrent Tasks</Label>
                <Select value={settings.maxConcurrentTasks} onValueChange={(value) => handleSettingChange("maxConcurrentTasks", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 tasks</SelectItem>
                    <SelectItem value="5">5 tasks</SelectItem>
                    <SelectItem value="10">10 tasks</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Poligap Integration
              </CardTitle>
              <CardDescription>
                Manage integration with Poligap platform and external services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Poligap Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Sync data with your Poligap workspace
                  </p>
                </div>
                <Switch
                  checked={settings.krooloSync}
                  onCheckedChange={(checked) => handleSettingChange("krooloSync", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>API Access</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable API access for third-party integrations
                  </p>
                </div>
                <Switch
                  checked={settings.apiAccess}
                  onCheckedChange={(checked) => handleSettingChange("apiAccess", checked)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  value={settings.webhookUrl}
                  onChange={(e) => handleSettingChange("webhookUrl", e.target.value)}
                  placeholder="https://your-app.com/webhook"
                />
                <p className="text-xs text-muted-foreground">
                  Receive real-time notifications about analysis results
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Billing & Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Current Plan</Label>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Professional Plan</p>
                    <p className="text-sm text-muted-foreground">
                      Unlimited AI agents, advanced analytics
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Upgrade
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="billingEmail">Billing Email</Label>
                <Input
                  id="billingEmail"
                  value={settings.billingEmail}
                  onChange={(e) => handleSettingChange("billingEmail", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Usage This Month</Label>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Documents Analyzed</span>
                    <span>0 / 500</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>AI Agent Hours</span>
                    <span>0 / 100</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>API Calls</span>
                    <span>0 / 10,000</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
