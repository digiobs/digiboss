import { Settings, Users, CreditCard, Link, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const integrations = [
  { name: 'Google Analytics', status: 'connected', lastSync: '2 hours ago' },
  { name: 'HubSpot', status: 'connected', lastSync: '30 minutes ago' },
  { name: 'LinkedIn Ads', status: 'connected', lastSync: '1 hour ago' },
  { name: 'Google Ads', status: 'pending', lastSync: null },
  { name: 'SEMrush', status: 'disconnected', lastSync: null },
];

const teamMembers = [
  { name: 'Alex Morgan', email: 'alex@company.com', role: 'Admin', status: 'active' },
  { name: 'Sarah Chen', email: 'sarah@company.com', role: 'Manager', status: 'active' },
  { name: 'Mike Johnson', email: 'mike@company.com', role: 'Contributor', status: 'active' },
  { name: 'Emily Watson', email: 'emily@company.com', role: 'Viewer', status: 'invited' },
];

const auditLog = [
  { action: 'Campaign created', user: 'Alex Morgan', time: '2 hours ago' },
  { action: 'Lead status updated', user: 'Sarah Chen', time: '3 hours ago' },
  { action: 'Report exported', user: 'Mike Johnson', time: '5 hours ago' },
  { action: 'Integration connected', user: 'Alex Morgan', time: '1 day ago' },
];

export default function Admin() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Admin</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Workspace settings, users, billing, and integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users & Roles */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Team Members</h2>
            </div>
            <Button size="sm">Invite</Button>
          </div>
          <div className="divide-y divide-border">
            {teamMembers.map((member) => (
              <div key={member.email} className="p-4 flex items-center justify-between hover:bg-muted/50">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{member.role}</Badge>
                  <Badge
                    variant="secondary"
                    className={
                      member.status === 'active' ? 'status-completed' : 'status-in-progress'
                    }
                  >
                    {member.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Integrations</h2>
            </div>
            <Button size="sm" variant="outline">Browse All</Button>
          </div>
          <div className="divide-y divide-border">
            {integrations.map((integration) => (
              <div key={integration.name} className="p-4 flex items-center justify-between hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Link className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    {integration.lastSync && (
                      <p className="text-xs text-muted-foreground">
                        Last sync: {integration.lastSync}
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    integration.status === 'connected'
                      ? 'status-completed'
                      : integration.status === 'pending'
                      ? 'status-in-progress'
                      : 'impact-low'
                  }
                >
                  {integration.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Billing */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Billing</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Pro Plan</p>
                <p className="text-sm text-muted-foreground">$99/month • Billed monthly</p>
              </div>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Next billing date</span>
              <span className="text-sm font-medium">Feb 1, 2024</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Usage this period</span>
              <span className="text-sm font-medium">2,340 / 5,000 AI credits</span>
            </div>
          </div>
        </div>

        {/* Security & Audit */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Audit Log</h2>
          </div>
          <div className="divide-y divide-border">
            {auditLog.map((log, index) => (
              <div key={index} className="p-3 flex items-center justify-between text-sm hover:bg-muted/50">
                <div>
                  <span className="font-medium">{log.action}</span>
                  <span className="text-muted-foreground"> by {log.user}</span>
                </div>
                <span className="text-xs text-muted-foreground">{log.time}</span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border">
            <Button variant="ghost" size="sm" className="w-full gap-2">
              View Full Log
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="font-semibold mb-4">Workspace Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">AI Recommendations</p>
              <p className="text-sm text-muted-foreground">Enable AI-powered next best actions</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive daily digest emails</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Slack Integration</p>
              <p className="text-sm text-muted-foreground">Post alerts to Slack channel</p>
            </div>
            <Switch />
          </div>
        </div>
      </div>
    </div>
  );
}
