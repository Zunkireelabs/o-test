'use client';

import { XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ErrorTemplate } from '@/types/ui-blocks';

interface ErrorCardProps {
  data: ErrorTemplate;
  onAction?: (action: string) => void;
}

export function ErrorCard({ data, onAction }: ErrorCardProps) {
  const { title, message, details, retryAction } = data;

  return (
    <Card className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Icon */}
          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-red-700 dark:text-red-300">{title}</h3>
            <p className="mt-1 text-sm text-red-600/80 dark:text-red-400/80">{message}</p>

            {/* Technical details (collapsible in future) */}
            {details && (
              <div className="mt-2 p-2 rounded bg-red-100/50 dark:bg-red-900/30">
                <code className="text-xs text-red-700 dark:text-red-300 font-mono break-all">
                  {details}
                </code>
              </div>
            )}

            {/* Retry button */}
            {retryAction && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAction?.(retryAction)}
                  className="text-xs border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/50"
                >
                  <RefreshCw className="w-3 h-3 mr-1.5" />
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
