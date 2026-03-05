'use client';

import { User, Mail, Phone, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { LeadCardTemplate } from '@/types/ui-blocks';

interface LeadCardProps {
  data: LeadCardTemplate;
  onAction?: (action: string, leadId: string) => void;
}

const actionLabels: Record<string, string> = {
  assign: 'Assign Owner',
  move_stage: 'Move Stage',
  send_email: 'Send Email',
  edit: 'Edit',
  delete: 'Delete',
};

const actionTitles: Record<LeadCardTemplate['action'], string> = {
  created: 'Lead Created',
  updated: 'Lead Updated',
  moved: 'Stage Updated',
  assigned: 'Lead Assigned',
  view: 'Lead Details',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function LeadCard({ data, onAction }: LeadCardProps) {
  const { action, lead, previousStage, newStage, assignedTo, actions = [] } = data;

  const handleAction = (actionType: string) => {
    onAction?.(actionType, lead.id);
  };

  return (
    <Card className="overflow-hidden border-l-4 border-l-emerald-500">
      {/* Header */}
      <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/50">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {actionTitles[action]}
          </span>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Lead Info */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {getInitials(lead.name)}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{lead.name}</h3>

            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{lead.email}</span>
              </div>

              {lead.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{lead.phone}</span>
                </div>
              )}

              {(lead.stageName || lead.stage) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                  <Badge variant="secondary" className="text-xs">
                    {lead.stageName || lead.stage}
                  </Badge>
                </div>
              )}

              {lead.owner && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{lead.owner}</span>
                </div>
              )}

              {!lead.owner && action !== 'assigned' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="italic">Unassigned</span>
                </div>
              )}
            </div>

            {/* Stage Change Info */}
            {action === 'moved' && previousStage && newStage && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-xs">{previousStage}</Badge>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  {newStage}
                </Badge>
              </div>
            )}

            {/* Assignment Info */}
            {action === 'assigned' && assignedTo && (
              <div className="mt-3 text-sm text-muted-foreground">
                Assigned to <span className="font-medium text-foreground">{assignedTo}</span>
              </div>
            )}

            {/* Created Date */}
            {lead.createdAt && action === 'created' && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>Created just now</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
            {actions.map((actionType) => (
              <Button
                key={actionType}
                variant="outline"
                size="sm"
                onClick={() => handleAction(actionType)}
                className="text-xs"
              >
                {actionLabels[actionType] || actionType}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
