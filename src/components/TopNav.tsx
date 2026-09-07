'use client';

import React from 'react';
import { Shield, Download, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserRole } from '@/lib/types';

interface TopNavProps {
  currentTab: string;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  openExportModal: () => void;
}

export function TopNav({ currentTab, userRole, setUserRole, openExportModal }: TopNavProps) {
  const pageTitles: Record<string, string> = {
    dashboard: 'Live Dashboard',
    sensors: 'Sensor Nodes',
    alerts: 'Alert Center',
    cqi: 'Coating Quality',
    config: 'Settings & Audit'
  };

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger could go here if needed, for now just a placeholder for title */}
        <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-muted-foreground">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold tracking-tight">{pageTitles[currentTab] || 'Dashboard'}</h1>
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={openExportModal}
          className="hidden sm:flex items-center gap-1.5 cursor-pointer h-9 text-xs font-medium"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Data</span>
        </Button>
        <ThemeToggle />

        <div className="flex items-center gap-2 border rounded-md px-2 h-9 bg-card">
          <Shield className="h-3.5 w-3.5 text-muted-foreground ml-1" />
          <Select value={userRole} onValueChange={(val) => setUserRole(val as UserRole)}>
            <SelectTrigger className="h-7 border-0 bg-transparent shadow-none text-xs font-medium focus:ring-0 focus:ring-offset-0 w-[140px] px-2">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="operator">Operator (View)</SelectItem>
              <SelectItem value="engineer">Engineer (Annotate)</SelectItem>
              <SelectItem value="administrator">Admin (Full)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
