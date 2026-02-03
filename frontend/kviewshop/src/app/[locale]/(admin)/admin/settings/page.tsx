'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'KviewShop',
    siteUrl: 'https://kviewshop.com',
    defaultCommission: 25,
    minCommission: 20,
    maxCommission: 30,
    mocraThresholdWarning: 800000,
    mocraThresholdDanger: 1000000,
    maintenanceMode: false,
    allowNewSignups: true,
  });

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage platform settings</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
          <TabsTrigger value="mocra">MoCRA</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Site Name</Label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Site URL</Label>
                  <Input
                    value={settings.siteUrl}
                    onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commission" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commission Settings</CardTitle>
              <CardDescription>Configure creator commission rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Default Commission (%)</Label>
                  <Input
                    type="number"
                    value={settings.defaultCommission}
                    onChange={(e) => setSettings({ ...settings, defaultCommission: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Commission (%)</Label>
                  <Input
                    type="number"
                    value={settings.minCommission}
                    onChange={(e) => setSettings({ ...settings, minCommission: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Commission (%)</Label>
                  <Input
                    type="number"
                    value={settings.maxCommission}
                    onChange={(e) => setSettings({ ...settings, maxCommission: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mocra" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MoCRA Settings</CardTitle>
              <CardDescription>US cosmetic sales thresholds for FDA compliance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Warning Threshold (Yellow) - USD</Label>
                  <Input
                    type="number"
                    value={settings.mocraThresholdWarning}
                    onChange={(e) => setSettings({ ...settings, mocraThresholdWarning: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Alert when US sales exceed this amount</p>
                </div>
                <div className="space-y-2">
                  <Label>Danger Threshold (Red) - USD</Label>
                  <Input
                    type="number"
                    value={settings.mocraThresholdDanger}
                    onChange={(e) => setSettings({ ...settings, mocraThresholdDanger: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Block sales when US sales exceed this amount</p>
                </div>
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Platform maintenance and access control</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Disable site access for non-admins</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow New Signups</Label>
                  <p className="text-sm text-muted-foreground">Allow new users to register</p>
                </div>
                <Switch
                  checked={settings.allowNewSignups}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowNewSignups: checked })}
                />
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
