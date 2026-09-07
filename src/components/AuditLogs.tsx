'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { AuditLog } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

interface AuditLogsProps {
  logs: AuditLog[];
}

export function AuditLogs({ logs }: AuditLogsProps) {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>Immutable System Audit Trail</span>
          </h3>
          <p className="text-xs text-muted-foreground">Security compliance logs recording user actions, threshold edits, and data mutations</p>
        </div>
        <Badge variant="outline" className="font-mono">
          {logs.length} Log Entries
        </Badge>
      </div>

      <ScrollArea className="h-72 w-full rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Action Type</TableHead>
              <TableHead>Resource ID</TableHead>
              <TableHead>Audit Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-mono text-xs">
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-muted-foreground font-sans">
                  No audit records logged.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="font-bold text-foreground">{log.user_id}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {log.action_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-primary">{log.affected_resource_id}</TableCell>
                  <TableCell className="font-sans text-muted-foreground">{log.details || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
}
