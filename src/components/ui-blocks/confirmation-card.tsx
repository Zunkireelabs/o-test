'use client';

import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ConfirmationTemplate } from '@/types/ui-blocks';

interface ConfirmationCardProps {
  data: ConfirmationTemplate;
  onAction?: (action: string) => void;
}

const typeStyles = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    Icon: CheckCircle2,
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    Icon: Info,
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    Icon: AlertTriangle,
  },
};

export function ConfirmationCard({ data, onAction }: ConfirmationCardProps) {
  const { title, message, type, details, actions } = data;
  const styles = typeStyles[type];
  const { Icon } = styles;

  return (
    <Card className={cn('border', styles.border, styles.bg)}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Icon */}
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', styles.iconBg)}>
            <Icon className={cn('w-4 h-4', styles.iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>

            {/* Details */}
            {details && details.length > 0 && (
              <div className="mt-3 space-y-1">
                {details.map((detail, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{detail.label}:</span>
                    <span className="font-medium text-foreground">{detail.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {actions && actions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant === 'outline' ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => onAction?.(action.action)}
                    className="text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
