'use client';

import React from 'react';
import { Activity, Cpu, AlertTriangle, Layers, Settings, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeAlertCount: number;
}

export function Sidebar({ currentTab, setCurrentTab, activeAlertCount }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Live Dashboard', icon: Activity },
    { id: 'sensors', label: 'Sensor Nodes', icon: Cpu },
    { id: 'alerts', label: 'Alert Center', icon: AlertTriangle, badge: activeAlertCount > 0 ? activeAlertCount : null },
    { id: 'cqi', label: 'Coating Quality', icon: Layers },
    { id: 'config', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card hidden md:flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-foreground">PaintShop</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Telemetry</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <Button
              key={item.id}
              variant={isActive ? 'secondary' : 'ghost'}
              className={`w-full justify-start ${isActive ? 'font-medium' : 'text-muted-foreground font-normal'}`}
              onClick={() => setCurrentTab(item.id)}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.label}
              {item.badge && (
                <Badge variant="destructive" className="ml-auto px-1.5 py-0 text-[10px]">
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* System Status */}
      <div className="p-4 border-t">
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Online</span>
          </div>
          <div className="text-xs text-muted-foreground">
            All ingestion pipelines active.
          </div>
        </div>
      </div>
    </aside>
  );
}
