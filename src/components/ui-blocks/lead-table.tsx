'use client';

import { useState } from 'react';
import { MoreHorizontal, ArrowUpDown, Mail, UserPlus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { LeadTableTemplate, LeadData } from '@/types/ui-blocks';

interface LeadTableProps {
  data: LeadTableTemplate;
  onAction?: (action: string, leadId: string) => void;
}

type SortKey = 'name' | 'email' | 'stage' | 'createdAt';
type SortDirection = 'asc' | 'desc';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function sortLeads(leads: LeadData[], sortKey: SortKey, direction: SortDirection): LeadData[] {
  return [...leads].sort((a, b) => {
    const aVal = a[sortKey] || '';
    const bVal = b[sortKey] || '';
    const comparison = String(aVal).localeCompare(String(bVal));
    return direction === 'asc' ? comparison : -comparison;
  });
}

export function LeadTable({ data, onAction }: LeadTableProps) {
  const { leads, title, sortable = true, showStage = true, showOwner = true, actions = [] } = data;

  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedLeads = sortable ? sortLeads(leads, sortKey, sortDirection) : leads;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleAction = (action: string, leadId: string) => {
    onAction?.(action, leadId);
  };

  const SortableHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <button
      onClick={() => handleSort(sortKeyName)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      {sortable && (
        <ArrowUpDown className={`w-3 h-3 ${sortKey === sortKeyName ? 'text-foreground' : 'opacity-50'}`} />
      )}
    </button>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {title || `${leads.length} Lead${leads.length !== 1 ? 's' : ''}`}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {leads.length} result{leads.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-y bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  <SortableHeader label="Name" sortKeyName="name" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  <SortableHeader label="Email" sortKeyName="email" />
                </th>
                {showStage && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    <SortableHeader label="Stage" sortKeyName="stage" />
                  </th>
                )}
                {showOwner && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Owner
                  </th>
                )}
                {actions.length > 0 && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium text-xs flex-shrink-0">
                        {getInitials(lead.name)}
                      </div>
                      <span className="font-medium text-sm">{lead.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {lead.email}
                  </td>
                  {showStage && (
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {lead.stageName || lead.stage || 'N/A'}
                      </Badge>
                    </td>
                  )}
                  {showOwner && (
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {lead.owner || <span className="italic text-muted-foreground/60">Unassigned</span>}
                    </td>
                  )}
                  {actions.length > 0 && (
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.includes('send_email') && (
                            <DropdownMenuItem onClick={() => handleAction('send_email', lead.id)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                          )}
                          {actions.includes('assign') && (
                            <DropdownMenuItem onClick={() => handleAction('assign', lead.id)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Assign Owner
                            </DropdownMenuItem>
                          )}
                          {actions.includes('move_stage') && (
                            <DropdownMenuItem onClick={() => handleAction('move_stage', lead.id)}>
                              <ArrowRight className="w-4 h-4 mr-2" />
                              Move Stage
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {leads.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No leads found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
